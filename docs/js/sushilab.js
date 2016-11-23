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
      try {
        var result = ('global', eval)(input_script);//eval in global scope
        //div_result.text(result);
        print_on_result_cell(div_result, result);
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
  }

  function print_on_result_cell(div, obj) {
    if (obj == null) {
      // empty
    } else if (typeof obj === 'object' && 'inspectElement' in obj) {
      // element
      var element_dom = $(obj.inspectElement());//assume "<p>" element
      div.append(element_dom);
    } else {
      // string
      var p = $(document.createElement('p'));
      var lines = obj.toString().split('\n');
      for (var i = 0; i < lines.length; i++) {
        p.append(document.createTextNode(lines[i]));
        p.append(document.createElement('br'));
      }
      div.append(p);
    }
  }

})();
