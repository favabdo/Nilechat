import { useState } from 'react';
import { addDaysToDateStr, addMonthsToDateStr, dateObjToInputValue } from '../../utils/dateFormat';

// نفس بالظبط لوجيك render (setContractDurationMode / recalcContractEndDate):
// بتاخد تاريخ البدء + مدة (عدد أيام، أو شهر/سنة) وتحسب تاريخ الانتهاء تلقائي
// وتحطه في الفورم اللي فوقها (عن طريق onEndDateChange). المستخدم لسه يقدر
// يعدّل تاريخ الانتهاء يدوي بعد كده لو حابب.
export default function ContractDurationPicker({ startDate, onEndDateChange }) {
  const [mode, setMode] = useState('days');
  const [days, setDays] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('month');

  function recalc(nextMode = mode, nextDays = days, nextValue = value, nextUnit = unit) {
    if (!startDate) return;
    let endDateObj = null;
    if (nextMode === 'days') {
      const d = parseInt(nextDays, 10);
      if (!d || d <= 0) return;
      endDateObj = addDaysToDateStr(startDate, d);
    } else {
      const v = parseInt(nextValue, 10);
      if (!v || v <= 0) return;
      const months = nextUnit === 'year' ? v * 12 : v;
      endDateObj = addMonthsToDateStr(startDate, months);
    }
    if (endDateObj) onEndDateChange(dateObjToInputValue(endDateObj));
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    recalc(nextMode);
  }

  return (
    <>
      <div className="mc-duration-toggle">
        <button type="button" className={`mc-duration-btn${mode === 'days' ? ' active' : ''}`} onClick={() => changeMode('days')}>
          عدد أيام
        </button>
        <button type="button" className={`mc-duration-btn${mode === 'unit' ? ' active' : ''}`} onClick={() => changeMode('unit')}>
          شهر / سنة
        </button>
      </div>
      {mode === 'days' ? (
        <input
          type="number"
          min="1"
          className="iw-input"
          placeholder="عدد الأيام"
          style={{ marginBottom: 8 }}
          value={days}
          onChange={(e) => {
            setDays(e.target.value);
            recalc(mode, e.target.value);
          }}
        />
      ) : (
        <div className="mc-duration-unit-wrap" style={{ marginBottom: 8 }}>
          <input
            type="number"
            min="1"
            className="iw-input"
            placeholder="العدد"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              recalc(mode, days, e.target.value);
            }}
          />
          <select
            className="iw-input"
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              recalc(mode, days, value, e.target.value);
            }}
          >
            <option value="month">شهر</option>
            <option value="year">سنة</option>
          </select>
        </div>
      )}
    </>
  );
}
