import { Controller } from "react-hook-form";
import TextField from "../Ui/TextField/TextField";
export default function FormText({ name, control, ...props }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          {...field}
          value={field.value ?? ""}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );
}
