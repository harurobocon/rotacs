"use client";

import React from "react";
import {
  Chip,
  Button,
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  ChipProps,
  User as NextUiUser,
  Selection,
  Spinner,
} from "@heroui/react";
import { capitalize } from "@heroui/shared-utils";
import { User as LuciaUser } from "lucia";
import { useAsyncList } from "@react-stately/data";

import { UserRole } from "@/types/auth";
import { deleteUsers } from "@/app/settings/users/actions";
import { cardStyles } from "@/components/settings/styles";

interface UserSettingsTableProps {
  className?: string;
  users: LuciaUser[];
}

const columns = [
  { name: "名前", uid: "display_name", sortable: true },
  { name: "ロール", uid: "role", sortable: true },
  { name: "ピットエリア", uid: "pit_side", sortable: true },
  { name: "ピット番号", uid: "pit_number", sortable: true },
  { name: "", uid: "actions", sortable: false },
];

const roleColorMap: Record<UserRole, ChipProps["color"]> = {
  admin: "primary",
  user: "default",
};

export default function UserSettingsTable(props: UserSettingsTableProps) {
  const [isTableLoading, setIsTableLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set([]),
  );

  let userList = useAsyncList<LuciaUser>({
    async load() {
      setIsTableLoading(false);

      return {
        items: props.users,
      };
    },
    async sort({ items, sortDescriptor }) {
      return {
        items: items.sort((a, b) => {
          if (!sortDescriptor || !sortDescriptor.column) return 0;
          let first = a[sortDescriptor.column as keyof LuciaUser]; // Add index signature
          let second = b[sortDescriptor.column as keyof LuciaUser]; // Add index signature
          let cmp = first < second ? -1 : first > second ? 1 : 0;

          return sortDescriptor.direction === "ascending" ? cmp : -cmp;
        }),
      };
    },
  });

  const handleDeleteSelectedUsers = () => {
    setIsDeleting(true);
  };

  const renderCell = React.useCallback(
    (user: LuciaUser, columnKey: React.Key) => {
      const cellValue = user[columnKey as keyof LuciaUser];

      switch (columnKey) {
        case "display_name":
          return (
            <NextUiUser
              avatarProps={{
                name: user.username.slice(0, 2).toUpperCase(),
              }}
              description={user.username}
              name={cellValue}
            />
          );
        case "role":
          return (
            <Chip
              className="capitalize"
              color={roleColorMap[user.role]}
              size="sm"
              variant="flat"
            >
              {capitalize(cellValue.toString())}
            </Chip>
          );
        case "actions":
          return (
            // 実装されてない
            //   <div className="relative flex items-center justify-end gap-2">
            //     <Dropdown>
            //       <DropdownTrigger>
            //         <Button isIconOnly size="sm" variant="light">
            //           <Icon
            //             className="h-6 w-6 text-default-500"
            //             icon="solar:menu-dots-bold"
            //           />
            //         </Button>
            //       </DropdownTrigger>
            //       <DropdownMenu>
            //         <DropdownItem>Delete</DropdownItem>
            //       </DropdownMenu>
            //     </Dropdown>
            //   </div>
            <></>
          );
        default:
          return cellValue;
      }
    },
    [],
  );

  const isUserSelected = selectedKeys === "all" || selectedKeys.size > 0;

  const userIdHiddenInputs = React.useMemo(() => {
    if (selectedKeys !== "all") {
      return Array.from(selectedKeys.values()).map((key) => (
        <input key={key} name="user_id" type="hidden" value={key.toString()} />
      ));
    } else if (selectedKeys === "all") {
      return Array.from(userList.items).map((user) => (
        <input key={user.id} name="user_id" type="hidden" value={user.id} />
      ));
    }

    return null;
  }, [selectedKeys, userList.items]);

  const topContent = React.useMemo(() => {
    return (
      <div className="flex w-full justify-end gap-3">
        <form action={deleteUsers} onSubmit={handleDeleteSelectedUsers}>
          <Button
            color="danger"
            isDisabled={!isUserSelected}
            isLoading={isDeleting}
            type="submit"
          >
            選択したユーザーを削除
          </Button>
          {/* Hidden input for selected user ids */}
          {userIdHiddenInputs}
        </form>
      </div>
    );
  }, [handleDeleteSelectedUsers]);

  return (
    <Card className={cardStyles()} shadow="none">
      <CardBody>
        <Table
          isHeaderSticky
          aria-label="メンバー管理テーブル"
          checkboxesProps={{
            classNames: {
              wrapper: [
                "after:bg-foreground after:text-background text-background",
              ],
            },
          }}
          classNames={{
            wrapper: "max-h-[382px] bg-transparent p-0 border-none shadow-none",
          }}
          selectedKeys={selectedKeys}
          selectionMode="multiple"
          sortDescriptor={userList.sortDescriptor}
          topContent={topContent}
          topContentPlacement="outside"
          onSelectionChange={setSelectedKeys}
          onSortChange={userList.sort}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
                allowsSorting={column.sortable}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            emptyContent={"No users found"}
            isLoading={isTableLoading}
            items={userList.items}
            loadingContent={<Spinner label="ロード中..." />}
          >
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
