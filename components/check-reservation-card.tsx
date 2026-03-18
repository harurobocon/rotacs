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
  Input,
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

import { cn } from "@/lib/cn";
import { CheckReservation, CheckStatus, CheckStatuses } from "@/types/check";
import {
  getCheckReservation,
  onCheckReservationChange,
  updateCheckStatus,
  updateCheckResults,
} from "@/lib/client/check";
import * as settingsClient from "@/lib/client/settings";
import { triggerCheckNotification } from "@/lib/server/check";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  CheckItemSetting,
  CheckItemsSettings,
  DEFAULT_CHECK_ITEM_SETTINGS,
} from "@/types/settings";

interface CheckReservationCardProps {
  className?: string;
  bgColor: string;
  reservationId: string;
  collectionId: string;
}

const infoText = tv({
  base: "text-xs block font-semibold text-default-500",
});

export default function CheckReservationCard(props: CheckReservationCardProps) {
  const [reservation, setReservation] = React.useState<CheckReservation | null>(
    null,
  );
  const [checkItemsSettings, setCheckItemsSettings] =
    React.useState<CheckItemsSettings>(DEFAULT_CHECK_ITEM_SETTINGS);
  const { isAdmin: isAdminUser } = useIsAdmin();
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

  const checkType = React.useMemo<"check1" | "check2">(
    () => (props.collectionId.includes("check2") ? "check2" : "check1"),
    [props.collectionId],
  );

  const enabledItems = React.useMemo<CheckItemSetting[]>(() => {
    return [...checkItemsSettings[checkType]]
      .filter((item) => item.enabled)
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  }, [checkItemsSettings, checkType]);

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

  React.useEffect(() => {
    const getItemsSettings =
      settingsClient.getCheckItemsSettings ??
      (async () => DEFAULT_CHECK_ITEM_SETTINGS);
    const listenItemsSettings =
      settingsClient.listenCheckItemsSettings ??
      ((callback: (settings: CheckItemsSettings) => void) => {
        callback(DEFAULT_CHECK_ITEM_SETTINGS);

        return () => {};
      });

    getItemsSettings().then(setCheckItemsSettings);

    return listenItemsSettings((next) => {
      setCheckItemsSettings(next);
    });
  }, []);

  async function handleStatusUpdate(status: CheckStatus) {
    setIsSubmitting(true);

    const result = await updateCheckStatus(
      props.reservationId,
      status,
      props.collectionId,
    );

    if (result.errors) {
      console.error(result.errors);
      setErrorMessage(result.errors);
      onOpenErrorDialog();
      setIsSubmitting(false);

      return;
    }

    try {
      await triggerCheckNotification(props.collectionId);
    } catch (error: any) {
      console.error(error);
    }

    setIsSubmitting(false);
  }

  async function handleResultSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const id = formData.get("id") as string;
    const collectionId = formData.get("collectionId") as string;
    const status = formData.get("status") as CheckStatus;

    if (!status) {
      setIsSubmitting(false);

      return;
    }

    const results: Record<string, boolean | string | number> = {};

    enabledItems.forEach((item) => {
      const key = `checkItem-${item.id}`;

      if (item.type === "boolean") {
        results[item.id] = formData.has(key);

        return;
      }

      const raw = String(formData.get(key) ?? "").trim();

      if (item.type === "number") {
        results[item.id] = raw.length === 0 ? "" : Number(raw);

        return;
      }

      results[item.id] = raw;
    });

    const result = await updateCheckResults(
      id,
      collectionId,
      status,
      results,
    );

    if (result.errors) {
      console.error(result.errors);
      setErrorMessage(result.errors);
      onOpenErrorDialog();
    } else {
      try {
        await triggerCheckNotification(props.collectionId);
      } catch (error: any) {
        console.error(error);
      }
      onOpenChangeResultInput(); // Close dialog on success
    }

    setIsSubmitting(false);
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
                    className="flex-col items-stretch justify-start gap-4"
                    onSubmit={handleResultSubmit}
                  >
                    {enabledItems.map((item) => {
                      const fieldName = `checkItem-${item.id}`;
                      const value = reservation[item.id] as
                        | boolean
                        | string
                        | number
                        | undefined;

                      if (item.type === "boolean") {
                        return (
                          <Checkbox
                            key={item.id}
                            className="flex"
                            defaultSelected={Boolean(value)}
                            name={fieldName}
                          >
                            {item.label}
                          </Checkbox>
                        );
                      }

                      if (item.type === "number") {
                        return (
                          <div
                            key={item.id}
                            className="mt-2 flex items-center gap-3"
                          >
                            <span className="min-w-[5rem] text-sm text-default-700">
                              {item.label}
                            </span>
                            <Input
                              className="max-w-[12rem]"
                              defaultValue={
                                value === undefined || value === null
                                  ? ""
                                  : String(value)
                              }
                              name={fieldName}
                              placeholder="数値"
                              type="number"
                            />
                          </div>
                        );
                      }

                      return (
                        <Textarea
                          key={item.id}
                          className="mt-2 flex"
                          defaultValue={
                            value === undefined || value === null ? "" : String(value)
                          }
                          label={item.label}
                          labelPlacement="outside"
                          name={fieldName}
                        />
                      );
                    })}
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
      <Table aria-label="計量計測の結果" className="w-full">
        <TableHeader>
          <TableColumn>項目</TableColumn>
          <TableColumn>結果</TableColumn>
        </TableHeader>
        <TableBody>
          {enabledItems.map((item) => {
            const value = reservation[item.id] as
              | boolean
              | string
              | number
              | undefined;
            let displayValue = "-";

            if (item.type === "boolean") {
              displayValue = Boolean(value) ? "OK" : "NG";
            } else if (value !== undefined && value !== null && String(value) !== "") {
              displayValue = String(value);
            }

            return (
              <TableRow key={item.id}>
                <TableCell>{item.label}</TableCell>
                <TableCell>
                  {displayValue === "NG" ? (
                    <span className="inline-flex rounded-full bg-danger-100 px-2 py-0.5 text-xs font-semibold text-danger">
                      NG
                    </span>
                  ) : (
                    displayValue
                  )}
                </TableCell>
              </TableRow>
            );
          })}
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
        {isAdminUser ? (
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
