"use client";

import "client-only";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Input,
  Radio,
  RadioGroup,
} from "@heroui/react";
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
} from "firebase/firestore";
import { ulid } from "ulid";

import { AuthGuard } from "@/components/AuthGuard";
import { FirestoreUser as User } from "@/types/user";
import {
  TestrunReservation,
  TestrunSide,
  TestrunStatus,
  TESTRUN_COLLECTION,
} from "@/types/testrun";
import { triggerNewTestrunReservationNotification } from "@/lib/server/testrun";
import { getAllFirestoreUsers } from "@/lib/server/firestoreUserHelpers";
import { useReservationControl } from "@/hooks/useReservationControl";
import { useAuth } from "@/lib/contexts/AuthContext";
import { firestore as db } from "@/lib/firebase/clientApp";

export default function NewTestrun() {
  const router = useRouter();
  const { user, isAdmin: isAdminUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMessageSubmitting, setIsMessageSubmitting] = React.useState(false);
  const [users, setUsers] = React.useState<User[] | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<React.Key | null>(
    null,
  );
  const [side, setSide] = React.useState<string>("");
  const [messageError, setMessageError] = React.useState("");

  const { isDisabled: isReservationDisabled, message: reservationMessage } =
    useReservationControl("testrun");

  const handleTestrunSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user) {
      router.push("/testrun/new/failed?message=ログインが必要です");

      return;
    }

    try {
      const bookerId =
        isAdminUser && selectedUser ? selectedUser.toString() : user.uid;
      const bookerDisplayName =
        isAdminUser && selectedUser
          ? (users?.find((u) => u.id === selectedUser.toString())?.display_name ?? user.displayName ?? "ユーザー")
          : (user.displayName || "ユーザー");

      let shouldNotifyNewReservation = false;
      const existsStatus: TestrunStatus[] = [
        "順番待ち",
        "呼出中",
        "移動中",
        "スタンバイ中",
        "実施中",
      ];

      await runTransaction(db, async (transaction) => {
        const reservationsRef = collection(db, TESTRUN_COLLECTION);

        // Fetch User Data for `pit_number` and `display_name`
        const userDocRef = doc(db, process.env.NEXT_PUBLIC_USER_COLLECTION || "users_dev", bookerId);
        const userDoc = await transaction.get(userDocRef);
        const userData = userDoc.data();
        const resolvedDisplayName =
          userData?.display_name || bookerDisplayName;
        const pitNumber = userData?.pit_number || null;

        // 1. Check if an active reservation already exists for this user
        const incompleteQuery = query(
          reservationsRef,
          where("user_id", "==", bookerId),
          where("status", "in", existsStatus),
        );
        const incompleteSnapshot = await getDocs(incompleteQuery);

        if (!incompleteSnapshot.empty) {
          throw new Error("既に予約が存在します");
        }

        // 2. Check total active reservations to see if we should notify
        const activeQuery = query(
          reservationsRef,
          where("status", "in", existsStatus),
        );
        const activeSnapshot = await getDocs(activeQuery);
        const currentActiveCount = activeSnapshot.size;

        // 3. Check finished reservations to determine reservation_count
        const finishedQuery = query(
          reservationsRef,
          where("user_id", "==", bookerId),
          where("status", "in", ["終了", "キャンセル"]),
        );
        const finishedSnapshot = await getDocs(finishedQuery);
        const reservationCount = finishedSnapshot.size + 1;

        // 4. Create the new reservation
        const reservationId = ulid();
        const newReservationRef = doc(reservationsRef, reservationId);
        const testrun = new TestrunReservation({
          id: reservationId,
          user_id: bookerId,
          user_display_name: resolvedDisplayName,
          reservation_count: reservationCount,
          status: "順番待ち",
          side: side as TestrunSide,
          pit_number: pitNumber,
        });

        transaction.set(newReservationRef, {
          ...testrun,
          reserved_at: testrun.reserved_at,
        });

        if (currentActiveCount === 0) {
          shouldNotifyNewReservation = true;
        }
      });

      // Notify after successful transaction
      if (shouldNotifyNewReservation) {
        await triggerNewTestrunReservationNotification(bookerId);
      }

      router.push("/testrun/new/success");
    } catch (error: any) {
      console.error(error);
      router.push("/testrun/new/failed?message=" + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsMessageSubmitting(true);
    setMessageError("");

    if (!user) {
      setMessageError("ログインが必要です");
      setIsMessageSubmitting(false);

      return;
    }

    const formData = new FormData(e.currentTarget);
    const message = formData.get("message")?.toString() || "";
    const messageSide = formData.get("side-radio")?.toString() || "赤";

    try {
      await runTransaction(db, async (transaction) => {
        const reservationsRef = collection(db, TESTRUN_COLLECTION);
        const reservationId = ulid();
        const newReservationRef = doc(reservationsRef, reservationId);

        const testrun = new TestrunReservation({
          id: reservationId,
          user_id: "dummy_user_id",
          user_display_name: message,
          reservation_count: 0,
          status: "順番待ち",
          side: messageSide as TestrunSide,
        });

        transaction.set(newReservationRef, {
          ...testrun,
          reserved_at: testrun.reserved_at,
        });
      });

      router.push("/testrun/new/success?message=カードを作成しました");
    } catch (error: any) {
      console.error(error);
      setMessageError(error.message);
      router.push("/testrun/new/failed?message=" + error.message);
    } finally {
      setIsMessageSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (isAdminUser) {
      getAllFirestoreUsers().then((usersData) => {
        setUsers(usersData);
      });
    }
  }, [isAdminUser]);

  const usersDropdown = React.useMemo(() => {
    const items = users?.map((user) => ({
      key: user.id,
      label: user.display_name,
    }));

    if (items) {
      return (
        <Autocomplete
          defaultItems={items}
          isDisabled={users === null}
          label={users ? "予約するユーザーを選択" : "読み込み中"}
          onSelectionChange={(key) => {
            console.log(key);
            setSelectedUser(key);
          }}
        >
          {(item) => (
            <AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>
          )}
        </Autocomplete>
      );
    } else {
      return null;
    }
  }, [users]);

  return (
    <AuthGuard requireAuth>
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
          <p className="pb-2 text-xl font-medium">新規テストラン予約</p>
          <form className="flex flex-col gap-3" onSubmit={handleTestrunSubmit}>
            <RadioGroup
              label="フィールドの色を選択してください"
              name="side"
              onValueChange={setSide}
            >
              <Radio value="赤">赤</Radio>
              <Radio value="青">青</Radio>
            </RadioGroup>
            {isAdminUser ? usersDropdown : null}
            <Button
              color="primary"
              isDisabled={side === "" || isReservationDisabled || isSubmitting}
              isLoading={isSubmitting}
              type="submit"
            >
              予約する
            </Button>
            {reservationMessage && (
              <p className="pt-2 text-center text-sm text-danger">
                {reservationMessage}
              </p>
            )}
          </form>
        </div>
        {isAdminUser ? (
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
            <p className="pb-2 text-xl font-medium">
              任意名のカードを作成（休憩・対戦形式など）
            </p>
            <form
              className="flex flex-col gap-3"
              onSubmit={handleMessageSubmit}
            >
              <RadioGroup
                defaultValue="赤"
                label="フィールドの色を選択してください"
                name="side-radio"
              >
                <Radio value="赤">赤</Radio>
                <Radio value="青">青</Radio>
              </RadioGroup>
              <Input required label="メッセージ" name="message" />
              <Button
                color="primary"
                isLoading={isMessageSubmitting}
                type="submit"
              >
                カードを作成する
              </Button>
              {messageError && (
                <p className="pt-2 text-center text-sm text-danger">
                  {messageError}
                </p>
              )}
            </form>
          </div>
        ) : null}
      </div>
    </AuthGuard>
  );
}
