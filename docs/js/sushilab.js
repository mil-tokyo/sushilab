'use strict';
(function () {
  $(function () {
    window.onerror = onerror_function;
    // $("#add-cell").click(function () {
    //   add_cell();
    // });

    add_cell();
  });

  $(document).on('keydown', 'textarea.cell', function (e) {
    if (e.shiftKey && e.keyCode === 13) {
      var textarea_cell_dom = this;
      var textarea_cell = $(textarea_cell_dom);
      var input_script = textarea_cell.val();

      var div_cell = textarea_cell.parents("div.cell");
      var div_result = $('<div class="result"></div>');
      div_cell.after(div_result);
      var result;
      try {
        result = ('global', eval)(input_script);//eval in global scope
        div_result.text(result);
      } catch (error) {
        div_result.addClass('error-cell');
        div_result.text(error.toString());
      }

      add_cell();
      return false;
    }
  });

  function add_cell() {
    var textarea = $('<textarea class="cell" rows="4" cols="80"></textarea>');
    var cell = $('<div class="cell"></div>');
    cell.append(textarea);
    $("#cells").append(cell);
    textarea.focus();
  }

  function onerror_function(msg, url, lineNo) {
    window.onerror = null;// to avoid infinite loop of calling this function
    console.log('error-callback');
    var div_result = $('<div class="result"></div>');
    div_result.addClass('error-cell');
    div_result.text('Error in asynchronous operation: ' + msg.toString());
    $("div.result").last().after(div_result);
    window.onerror = onerror_function;
    return false;// show error on console
  };

})();
