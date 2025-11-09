import { useParams } from "react-router-dom";
import Autocomplete from "../../../components/Ui/Autocomplete/Autocomplete";
import TextField from "../../../components/Ui/TextField/TextField";
import { FaTruckFieldUn } from "react-icons/fa6";
import FormText from "../../../components/FormControllers/FormText";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import FormSelect from "../../../components/FormControllers/FormSelect";
import RadioField from "../../../components/Ui/Radio/Radio";
import Radio from "../../../components/Ui/Radio/Radio";
import RadioGroup from "../../../components/Ui/RadioGroup/RadioGroup";
import FormRadios from "../../../components/FormControllers/FormRadios";
import Grid from "../../../components/Ui/Grid/Grid";

export default function AdForm({ mode }) {
  const { id } = useParams();

  const schema = z.object({
    name: z.string(),
    option: z.object({
      key: z.string(),
      value: z.string(),
    }),
    increase: z.string(""),
  });

  const { control, watch } = useForm({
    resolver: zodResolver(schema),
  });
  console.log(watch());

  const options = [
    { key: "facebook", value: "Facebook" },
    { key: "twitter", value: "Twitter" },
    { key: "instagram", value: "Instagram" },
    { key: "linkedin", value: "LinkedIn" },
  ];

  const radios = [
    { label: "facebook", value: "Facebook" },
    { label: "twitter", value: "Twitter" },
    { label: "instagram", value: "Instagram" },
    { label: "linkedin", value: "LinkedIn" },
  ];
  return (
    <div>
      {/* <FormSelect
        options={options}
        getOptionLabel={(option) => option.key}
        getOptionKey={(option) => option.value}
        label={"اختر الاسم"}
        control={control}
        name="option"
      /> */}
      <Grid container gap={10} justifyContent={"space-between"}>
        <Grid size={{ md: 3, sm: 12 }}>
          <p className="bg-red-400">1</p>
        </Grid>
        <Grid size={3}>
          <p className="bg-green-400">1</p>
        </Grid>
      </Grid>
      {/* <Radio label={"الوزن"} />
      <FormRadios
        radios={radios}
        label={"السعر قابل للتفاوض"}
        direction="row"
        control={control}
        name={"increase"}
      /> */}
      {/* <FormText
        label={"الوزن"}
        placeholder="hgwfekoef"
        control={control}
        name="name"
      /> */}
    </div>
  );
}
