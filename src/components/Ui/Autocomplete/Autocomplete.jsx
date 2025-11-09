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
  closeOptionsListAfterBlur,
  handleOpenFilterOptions,
  openOptionsList,
  clearFieldsValue,
  inputField,
  inputEvent,
  helperText,
  error,
}) {
  return (
    <div>
      <label>
        {label && (
          <p className={`mb-1 ${error ? "text-red-600" : "text-black"}`}>
            {label}
          </p>
        )}
        {/* field */}
        <div
          className={`bg-main flex items-center justify-between text-white p-2 rounded-xl border ${
            error ? "border-red-600" : "border-transparent"
          }`}
          ref={(el) => (inputField.current = el)}
        >
          <input
            type="text"
            placeholder="search"
            className="w-full focus:outline-none h-full ps-2 appearance-none"
            onChange={handleFilterOptions}
            value={filterSearchValue}
            onFocus={handleOpenFilterOptions}
            onBlur={closeOptionsListAfterBlur}
            ref={inputEvent}
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
        {helperText && <p className={`ms-3 mt-1 ${error ? "text-red-600" : "text-black"}`}>
          {"helperText"}
        </p>}
      </label>
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
  isSelecting,
  multiple,
}) {
  const height = inputField.current?.clientHeight || 0;
  const top = inputField.current?.offsetTop || 0;
  const left = inputField.current?.offsetLeft || 0;
  const width = inputField.current?.clientWidth || 0;
  return createPortal(
    <div className="mt-1 absolute" style={{ top: top + height, left, width }}>
      <ul
        style={{ display: openOptionsList ? "flex" : "none" }}
        className="max-h-50 overflow-y-auto shadow-2xl bg-white shadow-black flex items-center flex-col"
        onMouseEnter={() => (isSelecting.current = true)}
        onMouseLeave={() => (isSelecting.current = false)}
      >
        {options.map((option) => {
          const isSelected =
            selectOption &&
            (getOptionLabel
              ? getOptionLabel(selectOption) == getOptionLabel(option)
              : selectOption === option);
          return (
            <li
              key={getOptionKey ? getOptionKey(option) : option}
              className={`h-10 block hover:bg-main hover:text-white transition-all w-full leading-10 hover:indent-1 px-5 cursor-pointer ${
                isSelected ? "bg-main/30" : "bg-white"
              }`}
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
  onChange = () => {},
  multiple = false,
  value,
  error,
  helperText,
}) {
  const [selectOption, setSelectOption] = useState(value);
  const [filterOptions, setFilterOptions] = useState([...options]);
  const [filterSearchValue, setFilterSearchValue] = useState(
    value ? (getOptionLabel ? getOptionLabel(value) : value) : ""
  );
  const [openOptionsList, setOpenOptionsList] = useState(false);
  const inputField = useRef(null);
  const isSelecting = useRef(false);
  const inputEvent = useRef(null);

  function handleFilterOptions(e) {
    setFilterSearchValue(e.target.value);
    setFilterOptions(
      options.filter((el) =>
        (getOptionLabel ? getOptionLabel(el) : el).includes(e.target.value)
      )
    );
    inputEvent.current = e;
  }

  function handleSelectOption(option) {
    setSelectOption(option);
    onChange(inputEvent.current, option);
    setFilterSearchValue(getOptionLabel ? getOptionLabel(option) : option);
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

  function closeOptionsListAfterBlur() {
    if (!isSelecting.current) {
      setOpenOptionsList(false);
    }
  }

  return (
    <div>
      <AutocompleteInputField
        label={label}
        handleFilterOptions={handleFilterOptions}
        selectOption={selectOption}
        filterSearchValue={filterSearchValue}
        handleOpenFilterOptions={handleOpenFilterOptions}
        openOptionsList={openOptionsList}
        clearFieldsValue={clearFieldsValue}
        inputField={inputField}
        closeOptionsListAfterBlur={closeOptionsListAfterBlur}
        inputEvent={inputEvent}
        multiple={multiple}
        helperText={helperText}
        error={error}
      />
      <AutocompleteOptionsList
        isSelecting={isSelecting}
        options={filterOptions}
        getOptionKey={getOptionKey}
        getOptionLabel={getOptionLabel}
        selectOption={selectOption}
        handleSelectOption={handleSelectOption}
        openOptionsList={openOptionsList}
        inputField={inputField}
        multiple={multiple}
      />
    </div>
  );
}

AutocompleteOptionsList.propTypes = {
  options: PropTypes.array,
  multiple: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
};
