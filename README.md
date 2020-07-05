# jquery_data_validate

### How to use

**step1**:load jquery<br/>
**step2**:load this script<br/>
**step3**:inside your script, call the validate function <br>
```javascript
validate($("#exampleform"), "", false, "saveFunction");
```
**step4** :add validations as attributes to each inputs <br>
eg:<input type="text" name="email" data-validation="required,email" data-validation-error-msg-required="Email cannot be empty" data-validation-error-msg-email="Invalid Email"><br>
This will prevent the page from submiting until user inputed a valid email address.<br>
once the form is valid the script will release the hold and the control will be passed to the function you provided as an argument to validate.in this case the script will call 'saveFunction' once the form is valid <br>
you can provide your own validation rules too.<br>
eg:<input type="text" name="name" data-validation="required,is_joby" data-validation-error-msg-required="name cannot be empty" data-validation-error-msg-is_joby="Invalid"><br>
now inside your script you can write a function like below<br>
```javascript
function validate_is_joby($el,$form){
  if($el.val()=='joby'){
    return true;
  }
  return false;
}
```
<br>
This will make the input valid only if the user typed value 'joby'.<br>
You got the point you can use this to write yourown custom functions with your own rules. 
