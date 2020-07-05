/**
 * JQUERY FORMVALIDATION
 * @JOBY JOSEPH
 *
 */
errorElementClass = "error";
successElementClass = "valid";
borderColorOnError = "#b94a48";
errorMessageClass = "form-error";
inputParentClassOnError = "has-error";
inputParentClassOnSuccess = "has-success";
onEveryChange = false;
ignoreHiddenFields = true;

/**
 *
 * add a class 'ignoreMe' to prevent validation on that field
 */

/**
 *
 * @param {type} $form jquery (must be form object)
 * @param {type} fv_button (the button where user click to submit the non form element considered only if $form is not a form element)
 * @param {type} auto_submit_form (boolean value on whether to submit form automatically .if false then it will call the 4th argument function)
 * @param {type} handler_function (the function name to call if you pass false as third parameter)
 * @returns {undefined}
 */
function validate(
  $form,
  fv_button,
  auto_submit_form = true,
  handler_function = ""
) {
  //if ($form.prop("tagName").toLowerCase() == "form") {
    $form.on("submit", function (evt) {
      evt.stopImmediatePropagation();

      let syncValidations = new Promise((resolve) => {
        var error = 0;
        $form.find("[data-validation]").each(function () {
          var $input = $(this);

          var result = validateInput($input, $form);
          if (result["isValid"] == true) {
            removeInputStylingAndMessage($input);
          } else {
            if (error == 0) {
              $input.focus();
            }
            error++;
            applyInputErrorStyling($input);
            setInlineMessage($input, result["errorMsg"]);
          }
        });
        if (error > 0) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
      syncValidations.then(function (validated) {
        if (validated) {
          if (auto_submit_form == false) {
            if (typeof window[handler_function] === "function") {
              window[handler_function]($form);
            } else {
              initiateAjaxCall();
            }
          } else {
            $form.unbind("submit").submit();
          }
        }
      });
      return false;
    });
  //}
  /*
   * fired on input and textarea
   */
  $form.on(
    "blur",
    "textarea[data-validation],input[data-validation]",
    function (evt) {
        
      //evt.stopImmediatePropagation();
      var $input = $(evt.target);
      var result = validateInput($input, $form);
      if (result["isValid"] == true) {
        removeInputStylingAndMessage($input);
      } else {
        applyInputErrorStyling($input);
        setInlineMessage($input, result["errorMsg"]);
      }
    }
  );
  /*
   * fired on selectbox and checkboxes and radios
   */
  $form.on(
    "change",
    "select[data-validation]",
    function (evt) {
      // evt.stopImmediatePropagation();
      var $input = $(evt.target);
      var result = validateInput($input, $form);
      if (result["isValid"] == true) {
        removeInputStylingAndMessage($input);
      } else {
        applyInputErrorStyling($input);
        setInlineMessage($input, result["errorMsg"]);
      }
    }
  );
  if (onEveryChange) {
    /*
     * fire on every change to input or textarea
     */
    $form.on(
      "input",
      "input[data-validation],textarea[data-validation]",
      function (evt) {
        // evt.preventDefault();
        //evt.stopImmediatePropagation();
        var $input = $(evt.target);
        var result = validateInput($input, $form);
        if (result["isValid"] == true) {
          removeInputStylingAndMessage($input);
        } else {
          applyInputErrorStyling($input);
          setInlineMessage($input, result["errorMsg"]);
        }
      }
    );
  }
}

/*
 *
 * @param {type} $elem
 * @param {type} $form
 * @returns {validateInput.result}
 * function to validate input
 */

function validateInput($elem, $form) {
  var validationRules = $elem.attr("data-validation");
  var isValid = true;
  var errorMsg = "required";
  var result = { isValid: true, shouldChangeDisplay: true, errorMsg: "" };

  if ($elem.hasClass("ignoreMe")) {
    return result;
  }
  if (ignoreHiddenFields) {
    if ($elem.is(":hidden")) {
      return result;
    }
  }

  var rules_array = split(validationRules);

  $.each(rules_array, function (index, validation_function) {
    if (validation_function.indexOf("validate_") !== 0) {
      validation_function = "validate_" + validation_function;
    }

    if (typeof window[validation_function] === "function") {
      isValid = window[validation_function]($elem, $form);
    } else {
      console.error("no function found with name" + validation_function);
      console.log(
        "%c if you wrote the function makesure you wrote it in %cglobal scope.%cnever write functions inside document.ready()",
        "font-variant: small-caps",
        "color:green; text-decoration: underline",
        "font-variant: small-caps"
      );
    }

    if (!isValid) {
      errorMsg = resolveErrorMessage($elem, validation_function);
      return false; // break iteration
    }
  });

  if (isValid === false) {
    $elem.trigger("validation", false);
    result.errorMsg = errorMsg;
    result.isValid = false;
    result.shouldChangeDisplay = true;
  } else if (isValid === null) {
    // A validatorFunction returning null means that it's not able to validate
    // the input at this time. Most probably some async stuff need to gets finished
    // first and then the validator will re-trigger the validation.
    result.shouldChangeDisplay = false;
  } else {
    // $elem.trigger('validation', true);
    result.shouldChangeDisplay = true;
  }

  return result;
}

/*
 *
 * @param {type} val
 * @param {type} callback
 * @param {type} allowSpaceAsDelimiter
 * @returns {Array|$.split.values|Object.values}
 * to retrieve validations to applied from inputs data-validation field
 */

function split(val, callback, allowSpaceAsDelimiter) {
  // default to true
  allowSpaceAsDelimiter =
    allowSpaceAsDelimiter === undefined || allowSpaceAsDelimiter === true;
  var pattern = "[,|" + (allowSpaceAsDelimiter ? "\\s" : "") + "-]\\s*",
    regex = new RegExp(pattern, "g");

  // return array
  if (!val) {
    return [];
  }
  var values = [];
  $.each(val.split(callback ? callback : regex), function (i, str) {
    str = $.trim(str);
    if (str.length) {
      values.push(str);
    }
  });

  return values;
}
/*
 *
 * @param {type} $elem
 * @param {type} validatorName
 * @returns {String}
 * describes the error messages
 */

function resolveErrorMessage($elem, validatorName) {
  var errorMsgAttr =
      "data-validation-error-msg" +
      "-" +
      validatorName.replace("validate_", ""),
    validationErrorMsg = $elem.attr(errorMsgAttr);

  if (!validationErrorMsg) {
    validationErrorMsg = $elem.attr("data-validation-error-msg");
    if (!validationErrorMsg) {
      validationErrorMsg = "This field is required";
    }
  }
  return validationErrorMsg;
}

/*
 *
 * @param {type} $elem
 * @returns {getParentContainer.$parent}
 * function retrieves parent element of an input
 */
function getParentContainer($elem) {
  var $parent = $elem.parent();

  if ($elem[0].hasAttribute("data-validation-useCustomMessageDiv")) {
    let custom_message_div = $($elem).attr(
      "data-validation-useCustomMessageDiv"
    );
    if ($elem.closest(custom_message_div).length > 0) {
      var $parent = $elem.closest(custom_message_div);
    } else {
      if (
        $elem.attr("type") === "checkbox" &&
        $elem.closest(".checkbox").length
      ) {
        $parent = $elem.closest(".checkbox").parent();
      } else if (
        $elem.attr("type") === "radio" &&
        $elem.closest(".radio").length
      ) {
        $parent = $elem.closest(".radio").parent();
      }
      if ($parent.closest(".input-group").length) {
        $parent = $parent.closest(".input-group").parent();
      }
    }
  } else {
    if ($elem.closest("div.form-group").length > 0) {
      var $parent = $elem.closest("div.form-group");
    }
    if (
      $elem.attr("type") === "checkbox" &&
      $elem.closest(".checkbox").length
    ) {
      $parent = $elem.closest(".checkbox").parent();
    } else if (
      $elem.attr("type") === "radio" &&
      $elem.closest(".radio").length
    ) {
      $parent = $elem.closest(".radio").parent();
    }
    if ($parent.closest(".input-group").length) {
      $parent = $parent.closest(".input-group").parent();
    }
  }

  return $parent;
}

/*
 *
 * @param {type} $input
 * @returns {undefined}
 * this will add classes and styles to errors
 */

function applyInputErrorStyling($input) {
  $input.addClass(errorElementClass).removeClass(successElementClass);

  getParentContainer($input)
    .addClass(inputParentClassOnError)
    .removeClass(inputParentClassOnSuccess);

  if (borderColorOnError !== "") {
    $input.css("border-color", borderColorOnError);
    if (
      $($input).is("select") &&
      $input.closest("div.form-group").find("div.selectric").length > 0
    ) {
      $input
        .closest("div.form-group")
        .find("div.selectric")
        .css("border-color", borderColorOnError);
    }
  }
}

/*
 *
 * @param {type} $input
 * @returns {undefined}
 * this will remove all classes messages and styles applied to a input
 */
function removeInputStylingAndMessage($input) {
  $input
    .removeClass(errorElementClass)
    .removeClass(successElementClass)
    .css("border-color", "");

  if (
    $($input).is("select") &&
    $input.closest("div.form-group").find("div.selectric").length > 0
  ) {
    $input
      .closest("div.form-group")
      .find("div.selectric")
      .removeClass(errorElementClass)
      .removeClass(successElementClass)
      .css("border-color", "");
  }

  var $parentContainer = getParentContainer($input);

  // Reset parent css
  $parentContainer
    .removeClass(inputParentClassOnError)
    .removeClass(inputParentClassOnSuccess)
    .css("border-color", "");

  //remove message
  $parentContainer.find("." + errorMessageClass).remove();
}
/*
 *
 * @param {type} $form
 * @returns {undefined}
 * destroys plugin
 */
function destroy($form) {
  // Remove input css/messages
  $form
    .find("." + errorElementClass + ",." + successElementClass)
    .each(function () {
      removeInputStylingAndMessage($(this));
    });
}
/*
 * add error message
 */
function setInlineMessage($input, errorMsg) {
  var $parent = getParentContainer($input);
  $message = $parent.find("." + errorMessageClass + ".help-block");

  if ($message.length === 0) {
    $message = $("<span>" + errorMsg + "</span>")
      .addClass("help-block")
      .addClass(errorMessageClass);
    $message.appendTo($parent);
  } else {
    $message.remove();
    $message = $("<span>" + errorMsg + "</span>")
      .addClass("help-block")
      .addClass(errorMessageClass);
    $message.appendTo($parent);
  }
}

function applyInputSuccessStyling($input) {
  $input.addClass(successElementClass);
  if (
    $($input).is("select") &&
    $input.closest("div.form-group").find("div.selectric").length > 0
  ) {
    $input
      .closest("div.form-group")
      .find("div.selectric")
      .addClass(successElementClass);
  }

  getParentContainer($input).addClass(inputParentClassOnSuccess);
}
/*
 * validation functions begins
 */
function validate_required($el, $form) {
  switch ($el.prop("tagName").toLowerCase()) {
    case "input":
      switch ($el.prop("type").toLowerCase()) {
        case "text":
          return $.trim($el.val()) !== "";
          break;
        case "email":
          return $.trim($el.val()) !== "";
          break;
        case "password":
          return $.trim($el.val()) !== "";
          break;
        case "color":
          return $.trim($el.val()) !== "";
          break;
        case "number":
          return $.trim($el.val()) !== "";
          break;
        case "range":
          return $.trim($el.val()) !== "";
          break;
        case "search":
          return $.trim($el.val()) !== "";
          break;
        case "tel":
          return $.trim($el.val()) !== "";
          break;
        case "url":
          return $.trim($el.val()) !== "";
          break;
        case "time":
          return $.trim($el.val()) !== "";
          break;
        case "month":
          return $.trim($el.val()) !== "";
          break;
        case "date":
          return $.trim($el.val()) !== "";
          break;
        case "datetime-local":
          return $.trim($el.val()) !== "";
          break;
        case "file":
          return $el.get(0).files.length !== 0;
          break;
        case "checkbox":
          return $el.is(":checked");
          break;
        case "radio":
          return (
            $form
              .find('input[name="' + $el.attr("name") + '"]')
              .filter(":checked").length > 0
          );
          break;
        default:
          return false;
          break;
      }
      break;
    case "select":
      return $.trim($el.val()) !== "";
      break;
    case "textarea":
      return $.trim($el.val()) !== "";
      break;
    default:
      return false;
      break;
  }
}
/**
 *
 * @param {type} $el
 * @param {type} $form
 * @return {Boolean}
 */

function validate_email($el, $form) {
  var email = $($el).val();
  if ($.trim(email) != "") {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  } else {
    return true;
  }
}
/**
 *
 * @param {type} $el
 * @param {type} $form
 * @return {Boolean}
 */
function validate_onlyNumber($el, $form) {
  var number = $($el).val();
  if (number != "" && isNaN(number)) {
    return false;
  }
  return true;
}
/**
 *
 * @param {type} $el
 * @param {type} $form
 * @return {Boolean}
 */
function validate_domain($el, $form) {
  return (
    val.length > 0 &&
    val.length <= 253 && // Including sub domains
    !/[^a-zA-Z0-9]/.test(val.slice(-2)) &&
    !/[^a-zA-Z0-9]/.test(val.substr(0, 1)) &&
    !/[^a-zA-Z0-9\.\-]/.test(val) &&
    val.split("..").length === 1 &&
    val.split(".").length > 1
  );
}
/**
 * Date should be passed as yyyy/mm/dd or yyyy-mm-dd
 * @param {type} $el
 * @param {type} $form
 * @return {Boolean}
 */
function validate_date($el, $form) {
  let date = $el.val();
  if (date != "") {
    var isDate = function (date) {
      return new Date(date) !== "Invalid Date" && !isNaN(new Date(date));
    };
    if (!isDate) {
      return false;
    }
  }
  return true;
}
/**
 *
 * @param {type} $el
 * @param {type} $form
 * @return {Boolean}
 */
function validate_number($el, $form) {
  let value = $el.val();
  if (value != "") {
    if (value.match(/^[0-9]+$/) != null) {
      return true;
    } else {
      return false;
    }
  }
  return true;
}

/**
 *
 * @param {type} $el
 * @param {type} $form
 * @return {Boolean}
 */
function validate_url($el, $form) {
  let value = $el.val();
  if (value != "") {
    var pattern = new RegExp(
      "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // fragment locator
    if (!pattern.test(value)) {
      return false;
    }
  }
  return true;
}

/**
 *
 * @param {type} evt
 * @param {type} object
 * @return {Boolean}
 */
function latlongKey(evt, object) {
  var charCode = evt.which ? evt.which : event.keyCode;

  if (
    (String.fromCharCode(charCode) == "-" && object.value.indexOf("-") == -1) ||
    (String.fromCharCode(charCode) == "+" && object.value.indexOf("+") == -1) ||
    (String.fromCharCode(charCode) == "." && object.value.indexOf(".") == -1) ||
    /\d/g.test(String.fromCharCode(charCode)) ||
    charCode == 8
  ) {
    return true;
  } else {
    return false;
  }
}

/**
 * allow only integers
 * @param {type} evt
 * @param {type} object
 * @return {Boolean}
 */

function isNumberKey(evt, object) {
  var charCode = evt.which ? evt.which : event.keyCode;

  if (/\d/g.test(String.fromCharCode(charCode)) || charCode == 8) {
    return true;
  } else {
    return false;
  }
}
/**
 * allow floating numbers
 * @param {type} evt
 * @param {type} object
 * @returns {Boolean}
 */
function isFloatNumberKey(evt, object) {
  var charCode = evt.which ? evt.which : event.keyCode;

  if (
    (String.fromCharCode(charCode) == "." && object.value.indexOf(".") == -1) ||
    /\d/g.test(String.fromCharCode(charCode)) ||
    charCode == 8
  ) {
    return true;
  } else {
    return false;
  }
}
