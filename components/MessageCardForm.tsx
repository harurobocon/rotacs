import React from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { Button, Input, RadioGroup, Radio } from "@heroui/react";

import { ActionResult } from "@/types/actions";

interface HiddenField {
  name: string;
  value: string;
}

interface MessageCardFormProps {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  successRedirect: string;
  failedRedirect: string;
  hiddenFields?: HiddenField[];
  label?: string;
  buttonText?: string;
  enableSideSelect?: boolean;
}

const initialState: ActionResult = { errors: "" };

const MessageCardForm: React.FC<MessageCardFormProps> = ({
  action,
  successRedirect,
  failedRedirect,
  hiddenFields = [],
  label = "メッセージ",
  buttonText = "カードを作成する",
  enableSideSelect = false,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formState, formAction] = useFormState(action, initialState);
  const [side, setSide] = React.useState<string>("赤");

  React.useEffect(() => {
    if (isSubmitting) {
      if (formState.errors) {
        router.push(
          failedRedirect +
            (formState.errors ? `?message=${formState.errors}` : ""),
        );
      } else {
        router.push(successRedirect);
      }
    }
  }, [formState]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
  };

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3"
      onSubmit={handleSubmit}
    >
      {enableSideSelect && (
        <RadioGroup
          label="フィールドの色を選択してください"
          name="side-radio"
          value={side}
          onValueChange={setSide}
        >
          <Radio value="赤">赤</Radio>
          <Radio value="青">青</Radio>
        </RadioGroup>
      )}
      <Input label={label} name="message" />
      {enableSideSelect && <input name="side" type="hidden" value={side} />}
      {hiddenFields.map((field) => (
        <input
          key={field.name}
          name={field.name}
          type="hidden"
          value={field.value}
        />
      ))}
      <Button color="primary" isLoading={isSubmitting} type="submit">
        {buttonText}
      </Button>
    </form>
  );
};

export default MessageCardForm;
