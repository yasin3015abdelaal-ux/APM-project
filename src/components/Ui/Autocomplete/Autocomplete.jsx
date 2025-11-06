import PropTypes from "prop-types";
import { useState, useRef } from "react";
import { IoMdArrowDropdown } from "react-icons/io";
import IconButton from "../IconButtons/IconButton";
import { IoClose } from "react-icons/io5";
import { createPortal } from "react-dom";

function AutocompleteInputField({
  label,
  handleFilterOptions,
  filterSearchValue,
  handleCloseFilterOptions,
  handleOpenFilterOptions,
  openOptionsList,
  clearFieldsValue,
  inputField,
}) {
  return (
    <div>
      <p>{label}</p>
      {/* field */}
      <div
        className="bg-main flex items-center justify-between text-white p-2 rounded-xl"
        ref={(el) => (inputField.current = el)}
      >
        <input
          type="text"
          placeholder="search"
          className="w-full focus:outline-none h-full ps-2 appearance-none"
          onChange={handleFilterOptions}
          value={filterSearchValue}
          onFocus={handleOpenFilterOptions}
        />
        <div className="flex items-center gap-1">
          {openOptionsList && (
            <IconButton size="small" onClick={clearFieldsValue}>
              <IoClose fill="white" />
            </IconButton>
          )}
          <IconButton size="small" onClick={handleOpenFilterOptions}>
            <IoMdArrowDropdown fill="white" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function AutocompleteOptionsList({
  options,
  getOptionLabel,
  getOptionKey,
  handleSelectOption,
  selectOption,
  openOptionsList,
  inputField,
}) {
  const top = inputField.current?.offsetTop + inputField.current?.clientHeight;
  const left = inputField.current?.offsetLeft;
  const width = inputField.current?.clientWidth;
  return createPortal(
    <div className="mt-1 absolute" style={{ top, left, width }}>
      <ul
        style={{ display: openOptionsList ? "flex" : "none" }}
        className="max-h-50 overflow-y-auto shadow-2xl bg-white shadow-black flex items-center flex-col"
      >
        {options.map((option) => {
          const isSelected = selectOption === option;
          return (
            <li
              key={getOptionKey ? getOptionKey(option) : option}
              className="h-10 block hover:bg-main hover:text-white transition-all w-full leading-10 hover:indent-1 px-5 cursor-pointer"
              onClick={() => handleSelectOption(option)}
            >
              {getOptionLabel ? getOptionLabel(option) : option}
            </li>
          );
        })}
      </ul>
    </div>,
    document.body
  );
}

export default function Autocomplete({
  options,
  getOptionLabel,
  getOptionKey,
  label,
}) {
  const [selectOption, setSelectOption] = useState(null);
  const [filterOptions, setFilterOptions] = useState([...options]);
  const [filterSearchValue, setFilterSearchValue] = useState("");
  const [openOptionsList, setOpenOptionsList] = useState(false);
  const inputField = useRef(null);

  function handleFilterOptions(e) {
    setFilterSearchValue(e.target.value);
    setFilterOptions(options.filter((el) => el.includes(e.target.value)));
  }

  function handleSelectOption(option) {
    setSelectOption(option);
    setFilterSearchValue(option);
    handleCloseFilterOptions();
  }

  function handleCloseFilterOptions() {
    setOpenOptionsList(false);
    setFilterOptions(options);
  }

  function handleOpenFilterOptions() {
    setOpenOptionsList(true);
  }

  function clearFieldsValue() {
    setSelectOption(null);
    setFilterSearchValue("");
  }

  return (
    <div>
      <AutocompleteInputField
        label={label}
        handleFilterOptions={handleFilterOptions}
        selectOption={selectOption}
        filterSearchValue={filterSearchValue}
        handleCloseFilterOptions={handleCloseFilterOptions}
        handleOpenFilterOptions={handleOpenFilterOptions}
        openOptionsList={openOptionsList}
        clearFieldsValue={clearFieldsValue}
        inputField={inputField}
      />
      <AutocompleteOptionsList
        options={filterOptions}
        getOptionKey={getOptionKey}
        getOptionLabel={getOptionLabel}
        selectOption={selectOption}
        handleSelectOption={handleSelectOption}
        openOptionsList={openOptionsList}
        inputField={inputField}
      />
    </div>
  );
}

AutocompleteOptionsList.propTypes = {
  options: PropTypes.array,
};
