// Constructor function Đối tượng Validator
function Validator(options) {

    // Mong muốn sau khi forEach chạy xong thì lưu tất cả những hàm vào đây
    var selectorRules = {};

    // Hàm xoá bỏ invalid và message lỗi
    function validateRemove(inputElement) {
        var parentElement = getParent(inputElement, options.formGroupSelector);
        var errorElement = parentElement.querySelector(options.errorSelector);
        errorElement.innerText = '';
        parentElement.classList.remove('invalid');
    }

    // element là input, mong muốn selector là output để có thể ra ngoài được dù nhiều cấp hay 1 cấp
    function getParent(element, selector) {
        // Sử dụng vòng lặp để tìm '.form-group' nếu không tìm thấy thì
        // break để không treo. Sử dụng while do là vòng lặp vô hạn
        // Kiểm tra element.parenElement có match với selector không
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            // Mục đích là nếu mà chúng ta tìm ra thẻ input - đầu tiên chúng ta nhảy ra 1 cấp cha để tìm,
            // nếu mà ko match với form-group thì chúng ta gán element = với thẻ cha của thẻ input (ví dụ
            // bên ngoài thẻ input ban đầu có 1 thẻ div thì) lúc này element = div do đó không match => nó lại
            // nhảy lên vòng while chạy tiếp và cứ thế đến khi tìm ra thì break
            element = element.parentElement;
        }
    }
    
    // Hàm thực hiện việc validate
    function validate(inputElement, rule) {  
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        // Test blur + Lấy value người dùng
        // console.log('blur ' + rule.selector)
        // console.log(inputElement.value)
        // Lấy hàm test function: rule.test
        // Để lấy ra các rules của selector mà blur ra ngoài
        var rules = selectorRules[rule.selector];
        // console.log(rules);
        // biến errorMessage sẽ trả về undefined khi hàm test ko có lỗi và ngược lại
        var errorMessage;
        // Vì rules là 1 mảng nên ta cần lặp qua từng rule, rule nào có trước lấy trước
        for (var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'checkbox':
                case 'radio':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    // rules[i] === #email
                    errorMessage = rules[i](inputElement.value);
            }
            // Nếu có errorMessage thì dừng việc kiểm tra
            if (errorMessage) break;
        }

        // console.log(errorMessage);
        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid');
        } else {
            validateRemove(inputElement);
        }
        
        // Convert errorMessage thành true / false => hàm validate sẽ trả về true nếu ko có lỗi và ngược lại
        return !errorMessage;
    }

    

    // Lấy element của form cần validate
    var formElement = document.querySelector(options.form);
    if (formElement) {
        // Xử lý formSubmit, khi submit form
        formElement.onsubmit = function (e) {
            // Bỏ đi hành vi mặc định của event này
            e.preventDefault();

            var isFormValid = true;

            // Thực hiện lăp qua từng rules và validate
            options.rules.forEach(function (rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule); 
                // Nếu có 1 form không isValid thì sửa lại isFormValid
                if (!isValid) {
                    isFormValid = false;
                }
            });

            // Kiểm tra
            if (isFormValid) {
                if (typeof options.onSubmit === 'function') {
                    // Trường hợp sumbit với Javascript
                    // Lấy trạng thái của các form hiện tại
                    // Select tới tất cả các thẻ có attribute là name và không có attribute là disable
                    var enableInput = formElement.querySelectorAll('[name]:not([disabled])')
                    // Vì enableInput là 1 nodeList ko phải Array nên không thể dùng reduce để lấy
                    // Nên là sử dụng Array.from để convert sang Array
                    var formValues = Array.from(enableInput). reduce(function (values, input) {
                        // Để lấy giá trị name của input
                        // 1. lấy giá trị của input.value gán cho object values
                        // 2. trả về values
                        switch(input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case 'checkbox':
                                // Trong trường hợp cái input checkbox đi qua đây nó mà là checkbox ko được check thì return
                                if(input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values;
                                }
                                // Bởi vì là check box thì nó trả về array
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value)
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default: 
                                values[input.name] = input.value;
                        } 
                        return values;
                    }, {});
                    // console.log(formValues);
                    options.onSubmit(formValues);
                } 
                // Trường hợp sumbit với hành vi mặc định
                else {
                    // hành vi mặc định của trình duyệt
                    formElement.submit();
                }
            }
        };

        // Xử lý lặp qua mỗi rule và xử lý (lắng nghe event, blur, input, ...)
        options.rules.forEach(function (rule) {
            // Lưu lại các rules cho mỗi input
            // Nếu selectorRules[rule.selector] là array
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                 selectorRules[rule.selector] = [rule.test];
            }

            // Tìm input trong form bằng formElement, chứ không phải document vì
            // document là tìm hết các form trong trang 
            var inputElements = formElement.querySelectorAll(rule.selector);   
            
            Array.from(inputElements).forEach(function (inputElement) {
                // Nếu có thì lắng nghe event Onblur của nó
                // Xử lý trường hợp blur khỏi input
                inputElement.onblur = function () {
                    validate(inputElement, rule);
                }
                // Xử lý mỗi khi người dùng nhập vào input
                // oninput là event mỗi khi người dùng gõ
                inputElement.oninput = function () {
                    // console.log(inputElement.value) => Test sự kiện khi gõ vào
                    // Khi người dùng gõ thì bỏ đi message lỗi và xoá bỏ class invalid nếu có
                    validateRemove(inputElement);
                }
            });
        });
        // Biến electorRules đã nhận hết các rule bên index.html
        // console.log(selectorRules);
    }
}

// Định nghĩa rules
// Nguyên tắt của các rule:
// 1. Khi có lỗi thì trả ra message lỗi
// 2. Khi hợp lệ thì không trả ra gì cả
Validator.isRequired = function(selector, message) {
    return {
        selector: selector,
        // test để kiểm tra như thế nào là người dùng chưa nhập
        test: function (value) {
            // Sử dụng trim() trong phương thức string loại bỏ space ở 2 dầu
            // Tránh người dùng nhập toàn space
                return value ? undefined : message || 'Vui lòng nhập trường này'
        }
    }
}

Validator.isEmail = function(selector, message) {
    return {
        selector: selector,
        // test để kiểm tra như thế nào là người dùng chưa nhập
        test: function (value) {
            // search google: javascript email regex
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            return regex.test(value) ? undefined : message || 'Trường này phải là email';
        }
    }
}

Validator.minLength = function(selector, min, message) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min ? undefined : message || `Vui lòng nhập tối thiểu ${min} ký tự`;
        }
    }
}

// getConfirmValue là 1 Callback
// Theo UX nếu ngoài password thì hàm dưới đây cũng có thể dùng cho nhiều trường hợp khác
// nên ta phải thêm đối số message để nhận giá trị khác
Validator.isConfrimed = function (selector, getConfirmValue, message) {
    return {
        selector: selector,
        test: function (value) {
            return value === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác'
        }
    }
}