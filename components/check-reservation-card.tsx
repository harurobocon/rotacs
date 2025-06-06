"use client";

import React from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
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
  Radio,
  RadioGroup,
  Spacer,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { tv } from "tailwind-variants";
import { Icon } from "@iconify/react";
import { useFormState } from "react-dom";

import { cn } from "@/lib/cn";
import {
  CHECK1_COLLECTION,
  CheckReservation,
  CheckStatus,
  CheckStatuses,
} from "@/types/check";
import {
  getCheckReservation,
  onCheckReservationChange,
} from "@/lib/client/check";
import { updateCheckResults, updateCheckStatus } from "@/lib/server/check";
import { isAdmin } from "@/lib/client/auth";

interface CheckReservationCardProps {
  className?: string;
  bgColor: string;
  reservationId: string;
  collectionId: string;
}

const infoText = tv({
  base: "text-xs block font-semibold text-default-500",
});

const checkResultInitialState = {
  errors: "",
};

export default function CheckReservationCard(props: CheckReservationCardProps) {
  const [reservation, setReservation] = React.useState<CheckReservation | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [checkResultRadio, setCheckResultRadio] = React.useState<string | null>(
    null,
  );
  const {
    isOpen: isOpenErrorDialog,
    onOpen: onOpenErrorDialog,
    onOpenChange: onOpenChangeErrorDialog,
  } = useDisclosure();
  const {
    isOpen: isOpenResultInput,
    onOpen: onOpenResultInput,
    onOpenChange: onOpenChangeResultInput,
  } = useDisclosure();
  const [changeResultState, changeResultFormAction] = useFormState(
    updateCheckResults,
    checkResultInitialState,
  );

  React.useEffect(() => {
    getCheckReservation(props.reservationId, props.collectionId).then(
      (reservation) => {
        setReservation(reservation);
      },
    );

    return onCheckReservationChange(
      props.reservationId,
      props.collectionId,
      (newReservation) => {
        setReservation(newReservation);
      },
    );
  }, [props.reservationId]);

  async function handleStatusUpdate(status: CheckStatus) {
    setIsSubmitting(true);

    const result = await updateCheckStatus(
      props.reservationId,
      status,
      props.collectionId,
    );

    setIsSubmitting(false);

    if (result.errors) {
      console.error(result.errors);
      setErrorMessage(result.errors);
      onOpenErrorDialog();

      return;
    }
  }

  async function handleResultUpdate() {
    setIsSubmitting(true);
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
    } else if (
      (reservation.status === "合格" || reservation.status === "再検査") &&
      reservation.finished_at
    ) {
      updateTime =
        "終了時刻: " +
        reservation.finished_at.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
    } else if (reservation.status === "順番待ち") {
      updateTime = "";
    }
    const checkResultInput = (
      <>
        <Button onPress={onOpenResultInput}>計量計測結果入力</Button>
        <Modal
          isOpen={isOpenResultInput}
          onOpenChange={onOpenChangeResultInput}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  計量計測結果入力
                </ModalHeader>
                <ModalBody>
                  <form
                    action={changeResultFormAction}
                    className="flex-col items-stretch justify-start gap-4"
                  >
                    <Checkbox className="flex" name="r1ok">
                      R1 OK
                    </Checkbox>
                    <Checkbox className="flex" name="r2ok">
                      R2 OK
                    </Checkbox>
                    <Textarea
                      className="mt-4 flex"
                      label="メモ"
                      labelPlacement="outside"
                      name="memo"
                    />
                    <Textarea
                      className="mt-4 flex"
                      label="再検査項目"
                      labelPlacement="outside"
                      name="recheckItems"
                    />
                    <RadioGroup
                      className="mt-4 flex"
                      label="判定"
                      name="status"
                      value={checkResultRadio}
                      onValueChange={(value) => setCheckResultRadio(value)}
                    >
                      <Radio value="合格">合格</Radio>
                      <Radio value="再検査">再検査</Radio>
                    </RadioGroup>
                    <Button
                      className="mt-4 flex"
                      color="primary"
                      isDisabled={!checkResultRadio}
                      isLoading={isSubmitting}
                      type="submit"
                    >
                      送信
                    </Button>
                    <input name="id" type="hidden" value={reservation.id} />
                    <input
                      name="collectionId"
                      type="hidden"
                      value={props.collectionId}
                    />
                  </form>
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
      </>
    );
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
          changeStatusButton = <>{checkResultInput}</>;
          break;
      }
    }

    const results = (
      <Table className="w-full" aria-label="計量計測の結果">
        <TableHeader>
          <TableColumn>項目</TableColumn>
          <TableColumn>結果</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow key="R1 OK">
            <TableCell>R1 OK</TableCell>
            <TableCell>{reservation.r1ok ? "OK" : "NG"}</TableCell>
          </TableRow>
          <TableRow key="R2 OK">
            <TableCell>R2 OK</TableCell>
            <TableCell>{reservation.r2ok ? "OK" : "NG"}</TableCell>
          </TableRow>
          <TableRow key="メモ">
            <TableCell>メモ</TableCell>
            <TableCell>{reservation.memo}</TableCell>
          </TableRow>
          <TableRow key="再検査項目">
            <TableCell>再検査項目</TableCell>
            <TableCell>{reservation.recheckItems}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    card = (
      <Card className={cn("w-full flex-col items-stretch p-2", props.bgColor)}>
        <CardHeader className="grid w-full max-w-full grid-cols-1 justify-center gap-1 sm:grid-cols-3 sm:gap-4">
          <div className="flex-col items-start justify-start">
            <p className={infoText()}>
              {`受信時刻: ${reservation.reserved_at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
            </p>
            <p className={infoText()}>{updateTime}</p>
            <p className={infoText()}>{`実施場所: ${reservation.side}`}</p>
          </div>
          <div className="flex-col items-center justify-center">
            <h4
              className={cn(
                "text-center text-lg font-bold text-default-foreground",
              )}
            >
              {`#${reservation.pit_number} ${reservation.user_display_name}`}
            </h4>
            <p className={cn(infoText(), "text-center")}>
              {`${reservation.reservation_count}回目`}
            </p>
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
                    disabledKeys={isSubmitting ? CheckStatuses : []}
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
                        key="合格"
                        color="success"
                        onPress={() => handleStatusUpdate("合格")}
                      >
                        合格
                      </DropdownItem>
                      <DropdownItem
                        key="再検査"
                        color="warning"
                        onPress={() => handleStatusUpdate("再検査")}
                      >
                        再検査
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
            <Spacer y={2} />
            <Divider />
            <CardBody className="flex-row items-stretch justify-center gap-2">
              {changeStatusButton}
              {["合格", "再検査"].includes(reservation.status) ? results : null}
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
