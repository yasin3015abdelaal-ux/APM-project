import { Controller } from "react-hook-form";
import TextField from "../Ui/TextField/TextField";
import Autocomplete from "../Ui/Autocomplete/Autocomplete";
export default function FormSelect({ name, control, multiple, ...props }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Autocomplete
          {...props}
          {...field}
          onChange={(_, newValue) => field.onChange(newValue)}
          value={field.value || (multiple ? [] : null)}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );
}
