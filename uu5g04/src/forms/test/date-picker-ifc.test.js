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

describe("UU5.Form.DatePicker intreface testing", () => {
  it("parseDate(date)", () => {
    const wrapper = shallow(<UU5.Forms.DatePicker label="Date of birth" disableBackdrop id={"uuID01"} />);
    expect(wrapper.instance().parseDate("12/2/2017")).toEqual(expect.any(Object));
    const returnValue = wrapper.instance().parseDate("12/2/2017");
    expect(returnValue).toBeInstanceOf(Date);
    expect(wrapper.instance().parseDate("12/2/2017")).not.toBeNull();
    expect(wrapper).toMatchSnapshot();
  });

  it("toggle(setStateCallBack, e)", () => {
    const wrapper = mount(<UU5.Forms.DatePicker label="Date of birth" disableBackdrop id={"uuID01"} />);
    const mockFunc = jest.fn();
    expect(wrapper.instance().state.open).toBeFalsy();
    expect(wrapper.instance().state.open).toBeFalsy();
    const returnValue = wrapper.instance().toggle(mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().state.open).toBeTruthy();
    expect(wrapper.instance().state.open).toBeTruthy();
    wrapper.instance().toggle(); //close component
    wrapper.update();
    expect(wrapper.instance().state.open).toBeFalsy();
  });

  it("close(setStateCallBack, e)", () => {
    const wrapper = mount(<UU5.Forms.DatePicker label="Date of birth" disableBackdrop id={"uuID01"} />);
    const mockFunc = jest.fn();
    expect(wrapper.instance().state.open).toBeFalsy();
    wrapper.instance().toggle(mockFunc);
    wrapper.update();
    expect(wrapper.instance().state.open).toBeTruthy();
    const returnValue = wrapper.instance().close(mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().state.open).toBeFalsy();
  });
});

describe("UU5.Forms.InputMixin interface testing", () => {
  it("isInput()", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Valid time"
        placeholder="Enter time"
        value=""
        required={false}
        size="s"
      />
    );
    expect(wrapper.instance().isInput()).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("getValue() should return value", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Valid time"
        placeholder="Enter time"
        value="1/1/2017"
        required={false}
        size="s"
      />
    );
    let value = wrapper.instance().getValue();
    expect(value).toEqual(expect.any(Object));
    expect(value).not.toBeNull();
    expect(value).toBeInstanceOf(Date);
    expect(value.getFullYear()).toBe(2017);
    expect(value.getMonth()).toBe(0);
    expect(value.getDate()).toBe(1);
    // NOTE Expect hours to be 0. If we left it to be arbitrary (according to time zone, e.g. 2 when in GMT+2)
    // then users with negative timezone will have wrong day (e.g. in GMT-2, hours would be 22 but with previous day)
    expect(value.getHours()).toBe(0);
  });

  it("setValue(value,setStateCallBack)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Valid time"
        placeholder="Enter time"
        value=""
        required={false}
        size="s"
      />
    );
    expect(wrapper.instance().state.value).toEqual("");
    const mockFunc = jest.fn();
    expect(wrapper).toMatchSnapshot();
    const returnValue = wrapper.instance().setValue("12/12/2012", mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(mockFunc).toHaveBeenCalledTimes(1);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().state.value).toEqual("12/12/2012");
    expect(wrapper).toMatchSnapshot();
  });

  it("getMessage()", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={false}
        size="s"
      />
    );
    expect(wrapper.instance().getMessage()).toBe(null);
    expect(wrapper).toMatchSnapshot();
    wrapper.setProps({ message: "New Setting message" });
    expect(wrapper.instance().getMessage()).toMatch(/New Setting message/);
  });

  it("setMessage(msg, setStateCallBack)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={false}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.instance().getMessage()).toBeNull();
    const returnValue = wrapper.instance().setMessage("New Message", mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(mockFunc).toHaveBeenCalledTimes(1);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().getMessage()).toMatch(/New Message/);
    expect(wrapper).toMatchSnapshot();
  });

  it("getFeedBack()", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={false}
        size="s"
      />
    );
    expect(wrapper.instance().getFeedback()).toMatch(/initial/);
    expect(wrapper).toMatchSnapshot();
    wrapper.setProps({ feedback: "success" });
    wrapper.update();
    expect(wrapper.instance().getFeedback()).toMatch(/success/);
    expect(wrapper).toMatchSnapshot();
  });

  it("setFeedBack(feedback, message, value, setStateCallBack)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={false}
        size="s"
      />
    );
    expect(wrapper.instance().getFeedback()).toMatch(/initial/);
    expect(wrapper.instance().getMessage()).toBe(null);
    expect(wrapper.instance().state.value).toEqual("");
    const mockFunc = jest.fn();
    expect(wrapper).toMatchSnapshot();
    const returnValue = wrapper.instance().setFeedback("success", "This is valid message.", "12/12/2012", mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(mockFunc).toHaveBeenCalledTimes(1);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().getFeedback()).toEqual("success");
    expect(wrapper.instance().getMessage()).toEqual("This is valid message.");
    expect(wrapper.instance().state.value).toEqual("12/12/2012");
    expect(wrapper).toMatchSnapshot();
  });

  it("setInitial(msg, value, setStateCallBack)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        message={"This input is required"}
        feedback={"error"}
        required={true}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.instance().getFeedback()).toEqual("error");
    expect(wrapper.instance().state.value).toEqual("");
    expect(wrapper.instance().getMessage()).toEqual("This input is required");
    expect(wrapper.instance().isInitial()).toBeFalsy();
    const returnValue = wrapper.instance().setInitial("Initial Message", "", mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(mockFunc).toHaveBeenCalledTimes(1);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().getFeedback()).toEqual("initial");
    expect(wrapper.instance().state.value).toEqual("");
    expect(wrapper.instance().getMessage()).toEqual("Initial Message");
    expect(wrapper.instance().isInitial()).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("isInitial() shoud return true", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={false}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper.instance().isInitial()).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("isInitial() should return false", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={false}
        size="s"
        feedback={"error"}
        message={"Error messagess"}
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper.instance().isInitial()).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("setLoading(message, value, setStateCallBack)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={false}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.instance().state.value).toEqual("");
    expect(wrapper.instance().getMessage()).toBeNull();
    expect(wrapper.instance().isLoading()).toBeFalsy();
    const returnValue = wrapper.instance().setLoading("Loading messsagess", "12/12/2012", mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(mockFunc).toHaveBeenCalledTimes(1);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().isLoading()).toBeTruthy();
    expect(wrapper.instance().getMessage()).toEqual("Loading messsagess");
    expect(wrapper.instance().state.value).toEqual("12/12/2012");
    expect(wrapper).toMatchSnapshot();
  });

  it("isLoading()", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={false}
        size="s"
      />
    );
    expect(wrapper.instance().isLoading()).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("setSuccess(message, value, setStateCallBack)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={false}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper.instance().getFeedback()).toEqual("initial");
    expect(wrapper.instance().getMessage()).toBe(null);
    expect(wrapper.instance().state.value).toEqual("");
    expect(wrapper).toMatchSnapshot();
    const returnValue = wrapper.instance().setSuccess("This is success message", "12/12/2012", mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(mockFunc).toHaveBeenCalledTimes(1);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().getFeedback()).toEqual("success");
    expect(wrapper.instance().getMessage()).toEqual("This is success message");
    expect(wrapper.instance().state.value).toEqual("12/12/2012");
    expect(wrapper.instance().isSuccess()).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("isSuccess() fisr return false, second return true", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={true}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper.instance().isSuccess()).toBeFalsy();
    const returnValue = wrapper.instance().setSuccess("This is success message", "12/12/2012", mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(mockFunc).toHaveBeenCalledTimes(1);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().getFeedback()).toEqual("success");
    expect(wrapper.instance().getMessage()).toEqual("This is success message");
    expect(wrapper.instance().state.value).toEqual("12/12/2012");
    expect(wrapper.instance().isSuccess()).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("setWarning(message, value, setStateCallBack)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={false}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper.instance().getFeedback()).toEqual("initial");
    expect(wrapper.instance().getMessage()).toBe(null);
    expect(wrapper.instance().state.value).toEqual("");
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.instance().isSuccess()).toBeFalsy();
    expect(wrapper.instance().isWarning()).toBeFalsy();
    const returnValue = wrapper.instance().setWarning("This is warning message", "12/12/2012", mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(mockFunc).toHaveBeenCalledTimes(1);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().getFeedback()).toEqual("warning");
    expect(wrapper.instance().getMessage()).toEqual("This is warning message");
    expect(wrapper.instance().state.value).toEqual("12/12/2012");
    expect(wrapper.instance().isWarning()).toBeTruthy();
    expect(wrapper.instance().isSuccess()).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("isWarning()", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        feedback={"warning"}
        message={"Warning message"}
        required={true}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper.instance().getFeedback()).toEqual("warning");
    expect(wrapper.instance().getMessage()).toEqual("Warning message");
    expect(wrapper.instance().isWarning()).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
    const setRetVal = wrapper.instance().setFeedback("success", "success message", "12/12/2012", mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(setRetVal === wrapper.instance()).toBe(true);
    expect(wrapper.instance().isWarning()).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("setError(message, value, setStateCallBack)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker id={"idText"} label="Full name" placeholder="John Smith" value="" size="s" />
    );
    const mockFunc = jest.fn();
    expect(wrapper.instance().isError()).toBeFalsy();
    expect(wrapper.instance().isWarning()).toBeFalsy();
    expect(wrapper.instance().isSuccess()).toBeFalsy();
    expect(wrapper.instance().isInitial()).toBeTruthy();
    expect(wrapper.instance().state.value).toEqual("");
    expect(wrapper.instance().getFeedback()).toEqual("initial");
    expect(wrapper.instance().getMessage()).toBe(null);
    expect(wrapper).toMatchSnapshot();
    const returnValue = wrapper.instance().setError("This is error mesage", "12/12/2012", mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(mockFunc).toHaveBeenCalledTimes(1);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().isWarning()).toBeFalsy();
    expect(wrapper.instance().isSuccess()).toBeFalsy();
    expect(wrapper.instance().isInitial()).toBeFalsy;
    expect(wrapper.instance().isError()).toBeTruthy();
    expect(wrapper.instance().state.value).toEqual("12/12/2012");
    expect(wrapper.instance().getFeedback()).toEqual("error");
    expect(wrapper.instance().getMessage()).toEqual("This is error mesage");
    expect(wrapper).toMatchSnapshot();
  });

  it("isError()", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        feedback={"error"}
        message={"Error message"}
        required={true}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper.instance().getFeedback()).toEqual("error");
    expect(wrapper.instance().getMessage()).toEqual("Error message");
    expect(wrapper.instance().isError()).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
    const setRetVal = wrapper.instance().setFeedback("success", "success message", "12/12/2012", mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(setRetVal === wrapper.instance()).toBe(true);
    expect(wrapper.instance().isError()).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("reset(setStateCallBack)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={true}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    wrapper.instance().setFeedback("success", "New Message", "12/12/2012", mockFunc);
    wrapper.update();
    wrapper.instance().readOnly(mockFunc);
    wrapper.update();
    expect(wrapper.instance().getFeedback()).toEqual("success");
    expect(wrapper.instance().getMessage()).toEqual("New Message");
    expect(wrapper.instance().state.value).toEqual("12/12/2012");
    expect(wrapper.instance().isReadOnly()).toBeTruthy();
    expect(mockFunc).toBeCalled();
    expect(wrapper).toMatchSnapshot();
    //Now we reset seting value.
    const returnValue = wrapper.instance().reset(mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(mockFunc).toHaveBeenCalledTimes(3);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().state.value).toEqual("");
    expect(wrapper.instance().getFeedback()).toEqual("initial");
    expect(wrapper.instance().getMessage()).toBe(null);
    expect(wrapper.instance().isReadOnly()).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("getChangeFeedback()", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={true}
        size="s"
      />
    );
    expect(wrapper.instance().getChangeFeedback({})).toEqual(
      expect.objectContaining({
        feedback: "initial",
        message: null,
        value: "",
        foundAutocompleteItems: null,
        selectedIndex: null,
      })
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("setChangeFeedback()", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={true}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper.instance().getChangeFeedback({})).toEqual(
      expect.objectContaining({
        feedback: "initial",
        message: null,
        value: "",
        foundAutocompleteItems: null,
        selectedIndex: null,
      })
    );
    const returnValue = wrapper.instance().setChangeFeedback(
      {
        feedback: "success",
        message: "Success message from setChangeFeedback",
        value: "12.12.2012",
      },
      mockFunc
    );
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().state.value).toMatch(/12.12.2012/);
    expect(wrapper.instance().state.feedback).toEqual("success");
    expect(wrapper.instance().state.message).toEqual("Success message from setChangeFeedback");
    expect(wrapper).toMatchSnapshot();
  });

  it("isReadOnly()", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={true}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper.instance().isReadOnly()).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
    const returnValue = wrapper.instance().readOnly(mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().isReadOnly()).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("setEditableValue(true, setStateCallback)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value="12/12/2012"
        required={true}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.instance().isReadOnly()).toBeFalsy();
    expect(wrapper.instance().editable(mockFunc)).toBeTruthy();
    expect(mockFunc).toBeCalled();
    wrapper.instance().readOnly(mockFunc);
    wrapper.update();
    const returnValue = wrapper.instance().setEditableValue(true, mockFunc);
    wrapper.update();
    expect(mockFunc).toHaveBeenCalledTimes(3);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().isReadOnly()).toBeFalsy();
    expect(wrapper.instance().editable(mockFunc)).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
    expect(mockFunc).toHaveBeenCalledTimes(4);
  });

  it("setEditableValue(false, setStateCallback)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value="12/12/2012"
        required={true}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.instance().isReadOnly()).toBeFalsy();
    expect(wrapper.instance().editable(mockFunc)).toBeTruthy();
    expect(mockFunc).toBeCalled();
    wrapper.instance().readOnly(mockFunc);
    wrapper.update();
    const returnValue = wrapper.instance().setEditableValue(false, mockFunc);
    wrapper.update();
    expect(mockFunc).toHaveBeenCalledTimes(3);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().isReadOnly()).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
    expect(mockFunc).toHaveBeenCalledTimes(3);
  });

  it("readOnly(setStatecallback)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value="12/12/2012"
        required={true}
        size="s"
      />
    );
    expect(wrapper.instance().isReadOnly()).toBeFalsy();
    const mockFunc = jest.fn();
    expect(wrapper).toMatchSnapshot();
    const returnValue = wrapper.instance().readOnly(mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(mockFunc).toHaveBeenCalledTimes(1);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().isReadOnly()).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("editable(setStatecallback)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value="12/12/2012"
        required={true}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper.instance().isReadOnly()).toBeFalsy();
    expect(wrapper.instance().state.readOnly).toBeFalsy();
    wrapper.instance().readOnly(mockFunc);
    wrapper.update();
    expect(wrapper.instance().isReadOnly()).toBeTruthy();
    expect(wrapper.instance().state.readOnly).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
    const returnValue = wrapper.instance().editable(mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(mockFunc).toHaveBeenCalledTimes(2);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().isReadOnly()).toBeFalsy();
    expect(wrapper.instance().state.readOnly).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("getLabel(idinput)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value="12/12/2012"
        required={true}
        size="s"
      />
    );
    expect(wrapper.instance().getLabel()).not.toBeNull();
    expect(wrapper.instance().getLabel()).not.toBeUndefined();
    expect(() => wrapper.instance().getLabel()).not.toThrow();
    expect(wrapper.instance().getLabel()).toEqual(expect.any(Object));
    expect(wrapper.instance().getLabel()).toBeInstanceOf(Object);
    expect(wrapper).toMatchSnapshot();
  });

  it("getInputWrapper(inpuid)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value="12/12/2012"
        required={true}
        size="s"
      />
    );
    expect(wrapper.instance().getInputWrapper()).not.toBeNull();
    expect(wrapper.instance().getInputWrapper()).not.toBeUndefined();
    expect(() => wrapper.instance().getInputWrapper()).not.toThrow();
    expect(wrapper.instance().getInputWrapper()).toEqual(expect.any(Object));
    expect(wrapper.instance().getInputWrapper()).toBeInstanceOf(Object);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("UU5.Forms.TextInputMixin interface testing", () => {
  it("isTextInput() should return true", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value="12/12/2012"
        size="s"
      />
    );
    expect(wrapper.instance().isTextInput()).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("getInput()", () => {
    const wrapper = mount(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value="12/12/2012"
        size="s"
      />
    );
    expect(wrapper.instance().getInput()).toBe(wrapper.find("text-input").instance());
    expect(wrapper.instance().getInput()).toEqual(expect.any(Object));
    expect(wrapper.instance().getInput()).toBeInstanceOf(Object);
    expect(wrapper.instance().getInput()).not.toBe(undefined);
  });

  it("focus()", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value="12/12/2012"
        size="s"
      />
    );
    expect(wrapper).toMatchSnapshot();
    wrapper.instance().focus();
    wrapper.update();
    expect(wrapper).toMatchSnapshot();
  });

  it("isValid()", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value="12/12/2012"
        required={true}
        size="s"
      />
    );
    expect(wrapper.instance().isValid()).toBeTruthy();
    expect(wrapper).toMatchSnapshot();
  });

  it("isValid() should return false", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={true}
        size="s"
      />
    );
    expect(wrapper.instance().isValid()).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("open(setStateCallBack)", () => {
    const wrapper = mount(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value="12/"
        autocompleteItems={[
          {
            value: "12/12/2019",
          },
          {
            value: "13/12/2019",
          },
          {
            value: "14/12/2019",
          },
          {
            value: "15/12/2019",
          },
        ]}
        required={true}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper.instance().isOpen()).toBeFalsy();
    const returnValue = wrapper.instance().open(mockFunc);
    wrapper.update();
    expect(mockFunc).toBeCalled();
    expect(mockFunc).toHaveBeenCalledTimes(1);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper.instance().isOpen()).toBeTruthy();
  });

  it("isOpen() should return false", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        autocompleteItems={[
          {
            value: "12/12/2019",
          },
          {
            value: "13/12/2019",
          },
          {
            value: "14/12/2019",
          },
          {
            value: "15/12/2019",
          },
        ]}
        required={true}
        size="s"
      />
    );
    expect(wrapper.instance().isOpen()).toBeFalsy();
    expect(wrapper).toMatchSnapshot();
  });

  it("getFocusFeedback()", () => {
    const focusMessage = "Message";
    const wrapper = mount(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        focusMessage={focusMessage}
        required={true}
        size="s"
      />
    );
    wrapper.instance().focus();
    wrapper.update();
    expect(wrapper.instance().getFocusFeedback({})).toEqual({ feedback: "initial", value: "", message: focusMessage });
  });

  it("getBlurFeedback()", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={true}
        size="s"
      />
    );
    expect(wrapper.instance().getBlurFeedback({})).toEqual(
      expect.objectContaining({
        feedback: "initial",
        message: null,
        value: undefined,
      })
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("setAutocompleteItems(items,opt,setStateCallBack)", () => {
    const wrapper = shallow(
      <UU5.Forms.DatePicker
        id={"idText"}
        label="Enter valid time"
        placeholder="Valid time"
        value=""
        required={false}
        size="s"
      />
    );
    const mockFunc = jest.fn();
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.instance().state.autocompleteItems).toBe(null);
    const returnValue = wrapper.instance().setAutoCompleteItems(
      [
        {
          value: "12/12/2019",
        },
        {
          value: "13/12/2019",
        },
        {
          value: "14/12/2019",
        },
        {
          value: "15/12/2019",
        },
      ],
      null,
      mockFunc
    );
    wrapper.update();
    expect(wrapper.instance().state.autocompleteItems).not.toBe(null);
    expect(wrapper.instance().state.autocompleteItems).toEqual(
      expect.arrayContaining([
        { value: "12/12/2019" },
        { value: "13/12/2019" },
        { value: "14/12/2019" },
        { value: "15/12/2019" },
      ])
    );
    expect(mockFunc).toBeCalled();
    expect(mockFunc).toHaveBeenCalledTimes(1);
    expect(returnValue === wrapper.instance()).toBe(true);
    expect(wrapper).toMatchSnapshot();
  });
});
