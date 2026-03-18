"use client";

import React from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spacer,
  useDisclosure,
} from "@heroui/react";
import { tv } from "tailwind-variants";
import { Icon } from "@iconify/react";

import { cn } from "@/lib/cn";
import {
  TestrunReservation,
  TestrunStatus,
  TestrunStatuses,
} from "@/types/testrun";
import {
  getTestrunReservation,
  onTestrunReservationChange,
  updateTestrunRobotCheckEnabled,
  updateTestrunStatus,
} from "@/lib/client/testrun";
import { triggerTestrunNotification } from "@/lib/server/testrun";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface TestrunReservationCardProps {
  className?: string;
  bgColor: string;
  reservationId: string;
}

const infoText = tv({
  base: "text-xs block font-semibold text-default-500",
});

export default function TestrunReservationCard(
  props: TestrunReservationCardProps,
) {
  const [reservation, setReservation] =
    React.useState<TestrunReservation | null>(null);
  const { isAdmin: isAdminUser } = useIsAdmin();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const {
    isOpen: isOpenErrorDialog,
    onOpen: onOpenErrorDialog,
    onOpenChange: onOpenChangeErrorDialog,
  } = useDisclosure();

  React.useEffect(() => {
    getTestrunReservation(props.reservationId).then((reservation) => {
      setReservation(reservation);
    });

    return onTestrunReservationChange(props.reservationId, (newReservation) => {
      setReservation(newReservation);
    });
  }, [props.reservationId]);

  async function handleStatusUpdate(status: TestrunStatus) {
    setIsSubmitting(true);

    const result = await updateTestrunStatus(props.reservationId, status);

    if (result.errors) {
      console.error(result.errors);
      setErrorMessage(result.errors);
      onOpenErrorDialog();
      setIsSubmitting(false);

      return;
    }

    try {
      await triggerTestrunNotification();
    } catch (error: any) {
      console.error(error);
    }

    setIsSubmitting(false);
  }

  async function handleRobotCheckUpdate(enabled: boolean) {
    setIsSubmitting(true);

    const result = await updateTestrunRobotCheckEnabled(
      props.reservationId,
      enabled,
    );

    if (result.errors) {
      console.error(result.errors);
      setErrorMessage(result.errors);
      onOpenErrorDialog();
      setIsSubmitting(false);

      return;
    }

    setIsSubmitting(false);
  }

  let updateTime: React.ReactNode = null;
  let card = null;

  if (reservation) {
    if (
      ["呼出中", "移動中", "スタンバイ中", "実施中"].includes(
        reservation.status,
      ) &&
      reservation.fixed_at
    ) {
      updateTime = (
        <>
          <p className={infoText()}>
            {"呼出中: " +
              reservation.fixed_at.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
          </p>
          {reservation.status === "実施中" && reservation.started_at && (
            <p className={infoText()}>
              {"実施開始: " +
                reservation.started_at.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
            </p>
          )}
        </>
      );
    } else if (reservation.status === "終了" && reservation.finished_at) {
      updateTime = (
        <p className={infoText()}>
          {"終了時刻: " +
            reservation.finished_at.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
        </p>
      );
    } else if (reservation.status === "順番待ち") {
      updateTime = null;
    }

    let changeStatusButton = null;

    if (isAdminUser) {
      switch (reservation.status) {
        case "順番待ち":
          changeStatusButton = (
            <Button
              className="flex"
              color="primary"
              isLoading={isSubmitting}
              size="sm"
              onPress={() => handleStatusUpdate("呼出中")}
            >
              呼出中
            </Button>
          );
          break;
        case "呼出中":
          changeStatusButton = (
            <Button
              className="flex"
              color="primary"
              isLoading={isSubmitting}
              size="sm"
              onPress={() => handleStatusUpdate("移動中")}
            >
              移動中
            </Button>
          );
          break;
        case "移動中":
          changeStatusButton = (
            <Button
              className="flex"
              color="primary"
              isLoading={isSubmitting}
              size="sm"
              onPress={() => handleStatusUpdate("スタンバイ中")}
            >
              スタンバイ完了
            </Button>
          );
          break;
        case "スタンバイ中":
          changeStatusButton = (
            <Button
              className="flex"
              color="success"
              isLoading={isSubmitting}
              size="sm"
              onPress={() => handleStatusUpdate("実施中")}
            >
              開始
            </Button>
          );
          break;
        case "実施中":
          changeStatusButton = (
            <Button
              className="flex"
              color="danger"
              isLoading={isSubmitting}
              size="sm"
              onPress={() => handleStatusUpdate("終了")}
            >
              終了
            </Button>
          );
          break;
      }
    }

    card = (
      <Card className={cn("w-full flex-col items-stretch p-2", props.bgColor)}>
        <CardHeader className="grid w-full max-w-full grid-cols-1 justify-center gap-1 sm:grid-cols-3 sm:gap-4">
          <div className="flex-col items-start justify-start">
            <p className={infoText()}>
              {`受信時刻: ${reservation.reserved_at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
            </p>
            {updateTime}
          </div>
          <div className="flex-col items-center justify-center">
            <h4
              className={cn(
                "text-center text-lg font-bold text-default-foreground",
              )}
            >
              {reservation.pit_number && reservation.pit_number > 0
                ? `Pit${reservation.pit_number} ${reservation.user_display_name}`
                : reservation.user_display_name}
            </h4>
            {reservation.pit_number && reservation.pit_number > 0 ? (
              <p
                className={cn(infoText(), "text-center")}
              >{`${reservation.reservation_count}回目`}</p>
            ) : null}
            {reservation.robot_check_enabled ? (
              <div className="mt-1 flex justify-center">
                <span className="inline-flex items-center rounded-full bg-success-100 px-2 py-0.5 text-xs font-semibold text-success-700">
                  ロボットチェック実施
                </span>
              </div>
            ) : null}
          </div>
          <div className="h-full w-full items-start justify-end">
            {isAdminUser ? (
              <div className="flex items-center justify-end">
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly radius="full" size="sm" variant="flat">
                      <Icon
                        className="flex text-end text-2xl"
                        icon="solar:menu-dots-bold"
                      />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    disabledKeys={
                      isSubmitting
                        ? [
                            ...TestrunStatuses,
                            "robot-check-add",
                            "robot-check-remove",
                          ]
                        : []
                    }
                  >
                    <DropdownSection title="状態変更">
                      <DropdownItem
                        key="順番待ち"
                        color="default"
                        onPress={() => handleStatusUpdate("順番待ち")}
                      >
                        順番待ち
                      </DropdownItem>
                      <DropdownItem
                        key="呼出中"
                        color="primary"
                        onPress={() => handleStatusUpdate("呼出中")}
                      >
                        呼出中
                      </DropdownItem>
                      <DropdownItem
                        key="移動中"
                        color="primary"
                        onPress={() => handleStatusUpdate("移動中")}
                      >
                        移動中
                      </DropdownItem>
                      <DropdownItem
                        key="スタンバイ中"
                        color="primary"
                        onPress={() => handleStatusUpdate("スタンバイ中")}
                      >
                        スタンバイ中
                      </DropdownItem>
                      <DropdownItem
                        key="実施中"
                        color="success"
                        onPress={() => handleStatusUpdate("実施中")}
                      >
                        実施中
                      </DropdownItem>
                      <DropdownItem
                        key="終了"
                        color="danger"
                        onPress={() => handleStatusUpdate("終了")}
                      >
                        終了
                      </DropdownItem>
                      <DropdownItem
                        key="キャンセル"
                        color="danger"
                        onPress={() => handleStatusUpdate("キャンセル")}
                      >
                        キャンセル
                      </DropdownItem>
                    </DropdownSection>
                    <DropdownSection title="ロボットチェック">
                      <DropdownItem
                        key="robot-check-add"
                        color="warning"
                        onPress={() => handleRobotCheckUpdate(true)}
                      >
                        ロボットチェックを追加
                      </DropdownItem>
                      <DropdownItem
                        key="robot-check-remove"
                        color="default"
                        onPress={() => handleRobotCheckUpdate(false)}
                      >
                        ロボットチェックを削除
                      </DropdownItem>
                    </DropdownSection>
                  </DropdownMenu>
                </Dropdown>
              </div>
            ) : null}
          </div>
        </CardHeader>
        {isAdminUser && changeStatusButton ? (
          <>
            <Spacer y={2} />
            <Divider />
            <CardBody className="flex-row items-stretch justify-center gap-2">
              {changeStatusButton}
            </CardBody>
          </>
        ) : null}
      </Card>
    );
  }

  const errorModal = (
    <Modal isOpen={isOpenErrorDialog} onOpenChange={onOpenChangeErrorDialog}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">エラー</ModalHeader>
            <ModalBody>
              <p>{errorMessage}</p>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                閉じる
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );

  return (
    <>
      {card}
      {errorModal}
    </>
  );
}
