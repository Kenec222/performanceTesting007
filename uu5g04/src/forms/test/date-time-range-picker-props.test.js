/**
 * Copyright (C) 2021 Unicorn a.s.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License at
 * <https://gnu.org/licenses/> for more details.
 *
 * You may obtain additional information at <https://unicorn.com> or contact Unicorn a.s. at address: V Kapslovne 2767/2,
 * Praha 3, Czech Republic or at the email: info@unicorn.com.
 */

import UU5 from "uu5g04";
import "uu5g04-bricks";
import "uu5g04-forms";

const { mount, shallow, wait } = UU5.Test.Tools;

let origDateNow = Date.now;
let origGetLanguage = UU5.Common.Tools.getLanguage;
beforeEach(() => {
  Date.now = () => new Date(1548411167098); // 25.01.2019 11:12:47.098 GMT+0100
  UU5.Common.Tools.getLanguage = () => "en";
});
afterEach(() => {
  Date.now = origDateNow;
  UU5.Common.Tools.getLanguage = origGetLanguage;
});

let mockElement = document.createElement("div");
document.body.appendChild(mockElement);

let firstDate = new Date("2019-01-01T00:00:00").getTime();
let lastDate = new Date("2019-02-28T00:00:00").getTime();

//`${TAG_NAME}`
const CONFIG = {
  mixins: [
    "UU5.Common.BaseMixin",
    "UU5.Common.ElementaryMixin",
    "UU5.Common.PureRenderMixin",
    "UU5.Common.ColorSchemaMixin",
    "UU5.Common.ContentMixin",
    "UU5.Forms.InputMixin",
    "UU5.Forms.TextInputMixin",
  ],
  props: {
    value: {
      values: [
        ["1.1.2019", "5.5.2020"],
        [new Date("2019-01-01T12:15:30"), new Date("2019-02-28T23:11:30")],
      ],
    },
    dateFrom: {
      values: ["10.25.2018"],
    },
    dateTo: {
      values: ["10.5.2020"],
    },
    buttonHidden: {
      values: [true, false],
    },
    iconOpen: {
      values: ["mdi-clock-outline"],
    },
    iconClosed: {
      values: ["mdi-calendar"],
    },
    format: {
      values: ["dd.mm.Y", "dd/mm/Y", "dd-mm-Y", "dd:mm:Y - q"],
    },
    hideFormatPlaceholder: {
      values: [true, false],
    },
    country: {
      values: ["en-us"],
    },
    beforeRangeMessage: {
      values: ["Zkus zadat pozdější datum."],
    },
    afterRangeMessage: {
      values: ["Přestřelil jsi, zkus trochu ubrat."],
    },
    disableBackdrop: {
      values: [true, false],
    },
    seconds: {
      values: [true, false],
    },
    timeFormat: {
      timeFormat: [12, 24],
    },
    dateIcon: {
      values: ["uu5-plus"],
    },
    timeIcon: {
      values: ["uu5-clock"],
    },
    // parseDate - In agreement with developers, this props need not be tested.
  },
  requiredProps: {
    //The component does not have any required props
  },
  opt: {
    shallowOpt: {
      disableLifecycleMethods: false,
    },
  },
};

const ISOFormatTest = (props, country, expectedValue) => {
  const wrapper = mount(<UU5.Forms.DateTimeRangePicker {...props} country={country} id="uuID" />);

  expect(wrapper.find(".uu5-forms-datetimerangepicker-input-value").text()).toBe(expectedValue);
};

describe(`UU5.Forms.DateTimeRangePicker props`, () => {
  UU5.Test.Tools.testProperties(UU5.Forms.DateTimeRangePicker, CONFIG);

  it("timeFormat", () => {
    const wrapper = mount(
      <UU5.Forms.DateTimeRangePicker timeFormat={12} value={[new Date(firstDate), new Date(lastDate)]} />,
      { attachTo: mockElement }
    );
    const mainInput = wrapper.find(".uu5-forms-datetimerangepicker-input-value").first();
    expect(mainInput.text()).toBe("1/1/2019 12:00 AM - 2/28/2019 12:00 AM");
    mainInput.simulate("click");
    wrapper.update();
    const fromDateInput = wrapper
      .find(".uu5-forms-datetimerangepicker-from-wrapper .uu5-forms-datetimerangepicker-date-input input")
      .first();
    const fromTimePartInput = wrapper
      .find(".uu5-forms-datetimerangepicker-from-wrapper .uu5-forms-datetimerangepicker-time-part-input")
      .first();
    expect(fromTimePartInput.text()).toBe("AM");
    fromTimePartInput.simulate("click");
    wrapper.update();
    expect(fromTimePartInput.text()).toBe("PM");
    fromDateInput.getDOMNode().value = "2/2/2019";
    fromDateInput.simulate("change");
    wrapper.update();
    expect(mainInput.text()).toBe("2/2/2019 12:00 PM - 2/28/2019 12:00 AM");
    wrapper.unmount();
  });

  it(`ISO format value`, () => {
    let defaultCountry = "en-US";
    ISOFormatTest(
      { value: ["2019-07-20T07:00:00.000Z", "2019-07-25T07:00:00.000Z"] },
      defaultCountry,
      "7/20/2019 09:00 - 7/25/2019 09:00"
    );
    ISOFormatTest(
      { value: ["2019-07-20T07:00:00.000+02:00", "2019-07-25T07:00:00.000+02:00"] },
      defaultCountry,
      "7/20/2019 07:00 - 7/25/2019 07:00"
    );
    // FIXME Uncomment when Jest tests use full-icu so that Intl.DateTimeFormat works.
    // ISOFormatTest(
    //   { value: ["2019-07-20T07:00:00.000+02:00", "2019-07-25T07:00:00.000+02:00"] },
    //   "cs-CZ",
    //   "20. 7. 2019 07:00 - 25. 7. 2019 07:00"
    // );
    ISOFormatTest(
      { value: ["2019-07-20T07:00:00.000+02:00", "2019-07-25T07:00:00.000+02:00"], seconds: true },
      defaultCountry,
      "7/20/2019 07:00:00 - 7/25/2019 07:00:00"
    );
    ISOFormatTest(
      { value: ["2019-07-20T07:00:00.000+02:00", "2019-07-25T07:00:00.000+02:00"], timeFormat: "12" },
      defaultCountry,
      "7/20/2019 07:00 AM - 7/25/2019 07:00 AM"
    );
  });

  it(`pickerLabelFrom, pickerLabelTo`, () => {
    const wrapper = mount(<UU5.Forms.DateTimeRangePicker pickerLabelFrom="From" pickerLabelTo="To" />);
    wrapper.instance().open();
    expect(wrapper.findWhere((node) => node.text() === "From")).not.toBe(0);
    expect(wrapper.findWhere((node) => node.text() === "To")).not.toBe(0);
  });

  it(`timeStep + strictTimeStep`, () => {
    let wrapper;
    [
      { timeStep: undefined, feedback: "initial" },
      { timeStep: 10, feedback: "initial" },
      { timeStep: 30, feedback: "error" },
      { timeStep: 45, feedback: "error" },
    ].forEach((testMap) => {
      wrapper = mount(<UU5.Forms.DateTimeRangePicker timeStep={testMap.timeStep} strictTimeStep />);
      wrapper.instance().setValue(["2019-01-01T00:10:00", "2019-01-01T01:00:00"]);
      wrapper.update();
      expect(wrapper.instance().getFeedback()).toBe(testMap.feedback);
    });
  });

  // Not sure why this doesnt work
  // it(`hideResetButton`, () => {
  //   let wrapper = mount(<UU5.Forms.DateTimeRangePicker />);
  //   wrapper.instance().open();
  //   console.log(wrapper.find(".uu5-forms-datetimerangepicker-popover-second-row"));
  //   expect(
  //     wrapper
  //       .find(".uu5-forms-datetimerangepicker-popover-second-row .uu5-bricks-button")
  //       .findWhere((node) => node.name() === "button" && node.text() === "Reset").length
  //   ).toBe(1);
  //   wrapper = mount(<UU5.Forms.DateTimeRangePicker hideResetButton />);
  //   wrapper.instance().open();
  //   wrapper.update();
  //   expect(wrapper.find(".uu5-forms-datetimerangepicker-popover-second-row").length).toBe(0);
  // });
});

describe(`UU5.Forms.DateTimeRangePicker props function -> Text.InputMixin`, () => {
  it("onFocus()", () => {
    let onFocusFn = jest.fn();
    const wrapper = mount(<UU5.Forms.DateTimeRangePicker onFocus={onFocusFn} />, {
      attachTo: mockElement,
    });
    expect(onFocusFn).not.toHaveBeenCalled();
    document.getElementsByClassName("uu5-forms-items-input")[0].dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
    wrapper.update();
    expect(onFocusFn).toBeCalled();
    wrapper.unmount();
  });

  it("onBlur()", () => {
    let onBlurFn = jest.fn();
    const wrapper = mount(<UU5.Forms.DateTimeRangePicker onBlur={onBlurFn} />, {
      attachTo: mockElement,
    });
    expect(onBlurFn).not.toHaveBeenCalled();
    document.getElementsByClassName("uu5-forms-items-input")[0].dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
    wrapper.update();
    document.body.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
    wrapper.update();
    expect(onBlurFn).toBeCalled();
    wrapper.unmount();
  });

  it("onEnter()", () => {
    let onEnterFn = jest.fn();
    const wrapper = mount(<UU5.Forms.DateTimeRangePicker onEnter={onEnterFn} />, {
      attachTo: mockElement,
    });
    expect(onEnterFn).not.toHaveBeenCalled();
    document.getElementsByClassName("uu5-forms-items-input")[0].dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
    wrapper.update();
    document.getElementsByClassName("uu5-forms-input-form-item")[0].dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
    wrapper.update();
    document.getElementsByClassName("uu5-forms-input-form-item")[0].dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        view: window,
        keyCode: 13,
        key: "Enter",
      })
    );
    wrapper.update();
    expect(onEnterFn).toBeCalled();
    wrapper.unmount();
  });

  /**
   * You can not simulate events that do not start with it on. For example, onChange, onChangeFeedback.
   * Therefore, the validateonChange event is simulated here so that it is set to true, and event onValidate sets the message and feedback to error,
   * success if the component is valid. Valid component means that it is not empty and has the correct format.
   */

  it("validateOnChange() - input is invalid", () => {
    const wrapper = shallow(
      <UU5.Forms.DateTimeRangePicker
        id={"uuID"}
        label="Date of birth"
        validateOnChange={true}
        onValidate={(opt) => {
          let feedback;
          if (opt.value) {
            feedback = {
              feedback: "success",
              message: "Is valid.",
              value: opt.value,
            };
          } else {
            feedback = {
              feedback: "error",
              message: "Not valid.",
              value: opt.value,
            };
          }
          return feedback;
        }}
      />
    );
    expect(wrapper.instance().state.message).toEqual("Not valid.");
    expect(wrapper.instance().state.feedback).toEqual("error");
    expect(wrapper.instance().state.value).toEqual(null);
    expect(wrapper).toMatchSnapshot();
  });

  it("validateOnChange() - input is valid", () => {
    const wrapper = shallow(
      <UU5.Forms.DateTimeRangePicker
        id={"uuID"}
        value={[new Date(firstDate), new Date(lastDate)]}
        label="Date of birth"
        validateOnChange={true}
        onValidate={(opt) => {
          let feedback;
          if (opt.value) {
            feedback = {
              feedback: "success",
              message: "Is valid.",
              value: opt.value,
            };
          } else {
            feedback = {
              feedback: "error",
              message: "Not valid.",
              value: opt.value,
            };
          }
          return feedback;
        }}
      />
    );
    expect(wrapper.instance().state.message).toEqual("Is valid.");
    expect(wrapper.instance().state.feedback).toEqual("success");
    expect(Array.isArray(wrapper.instance().state.value)).toBeTruthy();
    expect(wrapper.instance().state.value.length).toBe(2);
    expect(wrapper.instance().state.value[0].getTime()).toBe(new Date(firstDate).getTime());
    expect(wrapper.instance().state.value[1].getTime()).toBe(new Date(lastDate).getTime());
    expect(wrapper).toMatchSnapshot();
  });

  it("timeZone", () => {
    const wrapper = shallow(
      <UU5.Forms.DateTimeRangePicker timeZone={3} value={["2019-11-01T10:00:00Z", "2019-11-01T12:00:00Z"]} />
    );
    let value = wrapper.instance().getValue();
    expect(value[0].getTime()).toBe(new Date("2019-11-01T10:00:00Z").getTime());
    expect(value[1].getTime()).toBe(new Date("2019-11-01T12:00:00Z").getTime());

    // TODO More tests - valueType, negative timeZone.
  });
});

describe(`UU5.Forms.DateTimeRangePicker props function -> Forms.InputMixin`, () => {
  it("onChange()", () => {
    let onChangeFn = jest.fn((opt) => opt.component.onChangeDefault(opt));
    const wrapper = mount(<UU5.Forms.DateTimeRangePicker onChange={onChangeFn} />, {
      attachTo: mockElement,
    });
    expect(onChangeFn).not.toHaveBeenCalled();
    wrapper.instance().open();
    wrapper.update();
    wrapper.find(".uu5-forms-calendar-active-section").first().simulate("click");
    wrapper.find(".uu5-forms-calendar-active-section").last().simulate("click");
    expect(onChangeFn).toBeCalled();
    let lastCall = onChangeFn.mock.calls[onChangeFn.mock.calls.length - 1];
    expect(lastCall[0]).toBeTruthy();
    expect(lastCall[0].component === wrapper.instance()).toBe(true);
    expect(Array.isArray(lastCall[0].value)).toBeTruthy();
    expect(lastCall[0].value.length).toBe(2);
    expect(lastCall[0].value[0]).toBeInstanceOf(Date);
    expect(lastCall[0].value[1]).toBeInstanceOf(Date);
    expect(lastCall[0].value[0].getTime()).toBe(firstDate);
    expect(lastCall[0].value[1].getTime()).toBe(lastDate);
    wrapper.unmount();
  });

  it(`onChangeDefault() with callback`, () => {
    let callback = jest.fn();
    let wrapper = shallow(<UU5.Forms.DateTimeRangePicker />);
    wrapper.instance().onChangeDefault({ _data: { type: "calendar" } }, callback);
    expect(callback).toBeCalled();
  });

  it("onValidate() + validateOnChange", () => {
    let onValidateFn = jest.fn((opt) => {
      return { feedback: "warning", message: "Message", value: opt.value };
    });
    const wrapper = mount(<UU5.Forms.DateTimeRangePicker onValidate={onValidateFn} validateOnChange />, {
      attachTo: mockElement,
    });
    expect(onValidateFn).toBeCalled();
    wrapper.instance().open();
    wrapper.update();
    wrapper.find(".uu5-forms-calendar-active-section").first().simulate("click");
    wrapper.find(".uu5-forms-calendar-active-section").last().simulate("click");
    expect(onValidateFn).toBeCalled();
    let lastCall = onValidateFn.mock.calls[onValidateFn.mock.calls.length - 1];
    expect(lastCall[0]).toBeTruthy();
    expect(lastCall[0].component === wrapper.instance()).toBe(true);
    expect(Array.isArray(lastCall[0].value)).toBeTruthy();
    expect(lastCall[0].value.length).toBe(2);
    expect(lastCall[0].value[0]).toBeInstanceOf(Date);
    expect(lastCall[0].value[1]).toBeInstanceOf(Date);
    expect(lastCall[0].value[0].getTime()).toBe(firstDate);
    expect(lastCall[0].value[1].getTime()).toBe(lastDate);
    wrapper.unmount();
  });

  it("onChangeFeedback()", () => {
    let onChangeFeedbackFn = jest.fn((opt) => opt.component.onChangeFeedbackDefault(opt));
    const wrapper = mount(<UU5.Forms.DateTimeRangePicker required onChangeFeedback={onChangeFeedbackFn} />, {
      attachTo: mockElement,
    });
    expect(onChangeFeedbackFn).not.toHaveBeenCalled();
    document.getElementsByClassName("uu5-forms-items-input")[0].dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
    wrapper.update();
    document.body.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
    wrapper.update();
    expect(onChangeFeedbackFn).toBeCalled();
    let lastCall = onChangeFeedbackFn.mock.calls[onChangeFeedbackFn.mock.calls.length - 1];
    expect(lastCall[0]).toBeTruthy();
    expect(lastCall[0].component === wrapper.instance()).toBe(true);
    expect(lastCall[0].feedback).toBe("error");
    expect(lastCall[0].message).toBeTruthy();
    wrapper.unmount();
  });
});

describe(`UU5.Forms.DateTimeRangePicker props function`, () => {
  it("parseDate()", function () {
    const dateValue = ["01:01:2019 10:00", "05:05:2020 12:00"];
    const parseDateFn = jest.fn((stringDate) => {
      let date = null;
      stringDate = stringDate && stringDate.replace(/ \d{1,2}:\d{1,2}(:\d{1,2})?/g, "");
      let regExp = new RegExp("^(\\d{1,2})\\:(\\d{1,2})\\:(\\d{4})$");
      if (regExp.test(stringDate)) {
        let replacedDate = stringDate.replace(regExp, "$3-$2-$1");
        date = Date.parse(replacedDate) ? new Date(replacedDate) : null;
      }
      return date;
    });
    const wrapper = shallow(
      <UU5.Forms.DateTimeRangePicker
        id={"checkID"}
        value={["02:02:2019 11:00", "04:04:2020 13:00"]}
        parseDate={parseDateFn}
        format="dd:mm:Y"
      />
    );
    parseDateFn.mockClear();
    // according to docs, parseDate is for parsing passed value, i.e. calling getValue()
    // should trigger it (though maybe multiple times so we'll check only last invocation)
    wrapper.setProps({ value: dateValue }).instance().getValue();
    expect(parseDateFn).toBeCalled();
    expect(wrapper.instance().state.value[0].getFullYear()).toEqual(new Date("1.1.2019").getFullYear());
    expect(wrapper.instance().state.value[0].getMonth()).toEqual(new Date("1.1.2019").getMonth());
    expect(wrapper.instance().state.value[0].getDate()).toEqual(new Date("1.1.2019").getDate());
    expect(wrapper.instance().state.value[1].getFullYear()).toEqual(new Date("5.5.2020").getFullYear());
    expect(wrapper.instance().state.value[1].getMonth()).toEqual(new Date("5.5.2020").getMonth());
    expect(wrapper.instance().state.value[1].getDate()).toEqual(new Date("5.5.2020").getDate());
    expect(wrapper).toMatchSnapshot();
  });
});

describe(`UU5.Forms.DateTimeRangePicker check default values`, () => {
  it(`UU5.Forms.DateTimeRangePicker default props`, () => {
    const wrapper = shallow(<UU5.Forms.DateTimeRangePicker id={"uuID"} />);
    expect(wrapper).toMatchSnapshot();
    //Check default values of props because it should not be in snapshot.
    expect(wrapper.instance().props.value).toBe(null);
    expect(wrapper.instance().props.dateFrom).toBe(null);
    expect(wrapper.instance().props.dateTo).toBe(null);
    expect(wrapper.instance().props.labelFrom).toBe(null);
    expect(wrapper.instance().props.labelTo).toBe(null);
    expect(wrapper.instance().props.innerLabel).toBeFalsy();
    expect(wrapper.instance().props.buttonHidden).toBeFalsy();
    expect(wrapper.instance().props.icon).toMatch(/mdi-calendar/);
    expect(wrapper.instance().props.iconOpen).toMatch(/mdi-menu-down/);
    expect(wrapper.instance().props.iconClosed).toMatch(/mdi-menu-down/);
    expect(wrapper.instance().props.format).toBe(null);
    expect(wrapper.instance().props.hideFormatPlaceholder).toBe(false);
    expect(wrapper.instance().props.hideWeekNumber).toBe(false);
    expect(wrapper.instance().props.showTodayButton).toBe(false);
    expect(wrapper.instance().props.country).toBe(null);
    expect(wrapper.instance().props.beforeRangeMessage).toMatchObject({
      cs: "Datum a čas je mimo rozsah.",
      en: "Date and time is out of range.",
    });
    expect(wrapper.instance().props.afterRangeMessage).toMatchObject({
      cs: "Datum a čas je mimo rozsah.",
      en: "Date and time is out of range.",
    });
    expect(wrapper.instance().props.parseDate).toBe(null);
    expect(wrapper.instance().props.disableBackdrop).toBeFalsy();
    expect(wrapper.instance().props.openToContent).toBe("xs");
  });

  it(`UU5.Commons.Mixin Base,Elementary`, () => {
    const wrapper = shallow(<UU5.Forms.DateTimeRangePicker id={"uuID"} />);
    //Check UU5.Common.Elementary.Mixin default props
    expect(wrapper.instance().props.hidden).toBeFalsy();
    expect(wrapper.instance().props.disabled).toBeFalsy();
    expect(wrapper.instance().props.selected).toBeFalsy();
    expect(wrapper.instance().props.controlled).toBeTruthy;
    //Check default values of props BaseMixin.
    expect(wrapper.instance().props.id).toEqual("uuID");
    expect(wrapper.instance().props.name).toBe(null);
    expect(wrapper.instance().props.tooltip).toBe(null);
    expect(wrapper.instance().props.className).toBe(null);
    expect(wrapper.instance().props.style).toBe(null);
    expect(wrapper.instance().props.mainAttrs).toBe(null);
    expect(wrapper.instance().props.parent).toBe(null);
    expect(wrapper.instance().props.ref_).toBe(null);
    expect(wrapper.instance().props.noIndex).toBeFalsy();
    //Check UU5.Common.PureRender.Mixin default values
    expect(wrapper.instance().props.pureRender).toBeFalsy();
  });

  it(`UU5.Forms.InputMixin`, () => {
    const wrapper = shallow(<UU5.Forms.DateTimeRangePicker id={"uuID"} />);
    expect(wrapper.instance().props.inputAttrs).toBe(null);
    expect(wrapper.instance().props.size).toEqual("m");
    expect(wrapper.instance().props.readOnly).toBeFalsy();
    expect(wrapper.instance().props.feedback).toEqual("initial");
    expect(wrapper.instance().props.message).toBe(null);
    expect(wrapper.instance().props.label).toBe(null);
    expect(wrapper.instance().props.onChange).toBe(null);
    expect(wrapper.instance().props.onValidate).toBe(null);
    expect(wrapper.instance().props.onChangeFeedback).toBe(undefined);
    expect(wrapper.instance().props.inputColWidth).toMatchObject({ xs: 12, s: 7 });
    expect(wrapper.instance().props.labelColWidth).toMatchObject({ xs: 12, s: 5 });
  });

  it(`UU5.Forms.TextInputMixin`, () => {
    const wrapper = shallow(<UU5.Forms.DateTimeRangePicker id={"uuID"} />);
    expect(wrapper.instance().props.placeholder).toBe(null);
    expect(wrapper.instance().props.required).toBeFalsy();
    expect(wrapper.instance().props.requiredMessage).toBe(null);
    expect(wrapper.instance().props.focusMessage).toBe(null);
    expect(wrapper.instance().props.patternMessage).toBe(null);
    expect(wrapper.instance().props.autocompleteItems).toBe(null);
    expect(wrapper.instance().props.onFocus).toBe(null);
    expect(wrapper.instance().props.onBlur).toBe(null);
    expect(wrapper.instance().props.onEnter).toBe(null);
    expect(wrapper.instance().props.validateOnChange).toBeFalsy();
  });
});
