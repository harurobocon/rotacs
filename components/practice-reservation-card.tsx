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
  PracticeReservation,
  PracticeStatus,
  PracticeStatuses,
} from "@/types/practice";
import {
  getPracticeReservation,
  onPracticeReservationChange,
} from "@/lib/client/practice";
import { updatePracticeStatus } from "@/lib/server/practice";
import { isAdmin } from "@/lib/client/auth";

interface PracticeReservationCardProps {
  className?: string;
  bgColor: string;
  reservationId: string;
}

const infoText = tv({
  base: "text-xs block font-semibold text-default-500",
});

export default function PracticeReservationCard(
  props: PracticeReservationCardProps,
) {
  const [reservation, setReservation] =
    React.useState<PracticeReservation | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const {
    isOpen: isOpenErrorDialog,
    onOpen: onOpenErrorDialog,
    onOpenChange: onOpenChangeErrorDialog,
  } = useDisclosure();

  React.useEffect(() => {
    getPracticeReservation(props.reservationId).then((reservation) => {
      setReservation(reservation);
    });

    return onPracticeReservationChange(
      props.reservationId,
      (newReservation) => {
        setReservation(newReservation);
      },
    );
  }, [props.reservationId]);

  async function handleStatusUpdate(status: PracticeStatus) {
    setIsSubmitting(true);

    const result = await updatePracticeStatus(props.reservationId, status);

    setIsSubmitting(false);

    if (result.errors) {
      console.error(result.errors);
      setErrorMessage(result.errors);
      onOpenErrorDialog();

      return;
    }
  }

  let updateTime = "";
  let card = null;

  if (reservation) {
    if (
      ["呼出中", "移動中", "実施中"].includes(reservation.status) &&
      reservation.fixed_at
    ) {
      updateTime =
        "呼出中: " +
        reservation.fixed_at.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
    } else if (reservation.status === "終了" && reservation.finished_at) {
      updateTime =
        "終了時刻: " +
        reservation.finished_at.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
    } else if (reservation.status === "順番待ち") {
      updateTime = "";
    }

    let changeStatusButton = null;

    if (isAdmin()) {
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
            <p className={infoText()}>{updateTime}</p>
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
          </div>
          <div className="h-full w-full items-start justify-end">
            {isAdmin() ? (
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
                    disabledKeys={isSubmitting ? PracticeStatuses : []}
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
                  </DropdownMenu>
                </Dropdown>
              </div>
            ) : null}
          </div>
        </CardHeader>
        {isAdmin() ? (
          <>
            <Divider />
            <CardBody className="flex-col items-stretch justify-start gap-2">
              {changeStatusButton}
            </CardBody>
          </>
        ) : null}
      </Card>
    );
  }

  return (
    <>
      {card}
      <Modal
        isOpen={isOpenErrorDialog}
        onOpenChange={onOpenChangeErrorDialog}
        placement="center"
      >
        <ModalContent>
          <ModalHeader>エラー</ModalHeader>
          <ModalBody>{errorMessage}</ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              onPress={onOpenChangeErrorDialog}
              variant="light"
            >
              閉じる
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
