import { Controller } from "react-hook-form";
import RadioGroup from "../Ui/RadioGroup/RadioGroup";

export default function FormRadios({ name, control, ...props }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <RadioGroup
          {...props}
          {...field}
          onChange={(_, newValue) => field.onChange(newValue)}
          value={field.value || ""}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          name={name}
        />
      )}
    />
  );
}
