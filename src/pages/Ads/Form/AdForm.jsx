import { useParams } from "react-router-dom";
import Autocomplete from "../../../components/Ui/Autocomplete/Autocomplete";
export default function AdForm({ mode }) {
  const { id } = useParams();

  const options = ["ahmed", "mohamed", "mahmoud", "salah"];
  return (
    <div>
      <Autocomplete options={options} getOptionLabel={(option) => option} label={"اختر الاسم"} />
    </div>
  );
}
