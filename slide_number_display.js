function displaySlideNumber(slideNumber) {
  if (Array.isArray(slideNumber)) {
    return slideNumber.join('-');
  }
  return slideNumber.toString();
}

// مثال للاستخدام
console.log(displaySlideNumber(7)); // النتيجة: "7"
console.log(displaySlideNumber([7, 8, 9])); // النتيجة: "7-8-9"