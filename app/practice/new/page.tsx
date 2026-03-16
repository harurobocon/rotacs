"use client";

import "client-only";

import React from "react";
import { useRouter } from "next/navigation";
import { Autocomplete, AutocompleteItem, Button, Input } from "@heroui/react";
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
} from "firebase/firestore";

import { FirestoreUser as User } from "@/types/user";
import { triggerNewPracticeReservationNotification } from "@/lib/server/practice";
import { getAllFirestoreUsers } from "@/lib/server/firestoreUserHelpers";
import {
  PRACTICE_COLLECTION,
  PracticeReservation,
  PracticeStatus,
} from "@/types/practice";
import { useReservationControl } from "@/hooks/useReservationControl";
import { useAuth } from "@/lib/contexts/AuthContext";
import { firestore as db } from "@/lib/firebase/clientApp";

export default function NewPractice() {
  const router = useRouter();
  const { user, isAdmin: isAdminUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMessageSubmitting, setIsMessageSubmitting] = React.useState(false);
  const [users, setUsers] = React.useState<User[] | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<React.Key | null>(
    null,
  );
  const [messageError, setMessageError] = React.useState("");

  const { isDisabled: isReservationDisabled, message: reservationMessage } =
    useReservationControl("practice");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user) {
      router.push("/practice/new/failed?message=ログインが必要です");

      return;
    }

    try {
      const bookerId =
        isAdminUser && selectedUser ? selectedUser.toString() : user.uid;
      let shouldNotifyNewReservation = false;
      const existsStatus: PracticeStatus[] = [
        "順番待ち",
        "呼出中",
        "移動中",
        "実施中",
      ];

      await runTransaction(db, async (transaction) => {
        const reservationsRef = collection(db, PRACTICE_COLLECTION);

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
          where("status", "==", "終了"),
        );
        const finishedSnapshot = await getDocs(finishedQuery);
        const reservationCount = finishedSnapshot.size + 1;

        // Fetch User Data for `display_name`
        const userDocRef = doc(db, "users", bookerId);
        const userDoc = await transaction.get(userDocRef);
        const userData = userDoc.data();
        const bookerDisplayName =
          userData?.display_name || user.displayName || "ユーザー";

        // 4. Create the new reservation
        const newReservationRef = doc(reservationsRef);
        const practice = new PracticeReservation({
          user_id: bookerId,
          user_display_name: bookerDisplayName,
          reservation_count: reservationCount,
          status: "順番待ち",
          side: "default",
        });

        transaction.set(newReservationRef, {
          ...practice,
          reserved_at: practice.reserved_at,
        });

        if (currentActiveCount === 0) {
          shouldNotifyNewReservation = true;
        }
      });

      // Notify after successful transaction
      if (shouldNotifyNewReservation) {
        await triggerNewPracticeReservationNotification(bookerId);
      }

      router.push("/practice/new/success");
    } catch (error: any) {
      console.error(error);
      router.push("/practice/new/failed?message=" + error.message);
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

    try {
      await runTransaction(db, async (transaction) => {
        const reservationsRef = collection(db, PRACTICE_COLLECTION);
        const newReservationRef = doc(reservationsRef);

        const practice = new PracticeReservation({
          user_id: user.uid,
          user_display_name: message,
          reservation_count: 0,
          status: "順番待ち",
          side: "default",
        });

        transaction.set(newReservationRef, {
          ...practice,
          reserved_at: practice.reserved_at,
        });
      });

      router.push("/practice/new/success?message=カードを作成しました");
    } catch (error: any) {
      console.error(error);
      setMessageError(error.message);
      router.push("/practice/new/failed?message=" + error.message);
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
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <p className="pb-2 text-xl font-medium">新規試走場予約</p>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          {isAdminUser ? usersDropdown : null}
          <Button
            color="primary"
            isDisabled={isReservationDisabled || isSubmitting}
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
          <form className="flex flex-col gap-3" onSubmit={handleMessageSubmit}>
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
  );
}
