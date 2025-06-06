import React from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { Button, Input } from "@heroui/react";
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
}

const initialState: ActionResult = { errors: "" };

const MessageCardForm: React.FC<MessageCardFormProps> = ({
  action,
  successRedirect,
  failedRedirect,
  hiddenFields = [],
  label = "メッセージ",
  buttonText = "カードを作成する",
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formState, formAction] = useFormState(action, initialState);

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
      <Input label={label} name="message" />
      {hiddenFields.map((field) => (
        <input
          key={field.name}
          type="hidden"
          name={field.name}
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
