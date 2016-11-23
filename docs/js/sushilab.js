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
      var cell_id = Number(div_cell.data('cell-id'));
      var div_result = $('<div class="result"></div>');
      div_result.data('cell-id', cell_id.toString());
      div_cell.after(div_result);
      var div_result_body = $('<div class="result-body"></div>');

      try {
        var result = ('global', eval)(input_script);//eval in global scope
        //div_result.text(result);
        print_on_result_cell(div_result_body, result);
      } catch (error) {
        div_result_body.addClass('error-cell');
        div_result_body.text(error.toString());
      }
      div_result.append('<span class="cell-id">Out ' + cell_id + '</span>');
      div_result.append(div_result_body);

      add_cell();
      return false;
    }
  });

  var next_cell_id = 1;
  function add_cell() {
    var cell_id = next_cell_id;
    next_cell_id++;
    var textarea = $('<textarea class="cell" rows="4" cols="80"></textarea>');
    var cell = $('<div class="cell" data-cell-id="' + cell_id + '"></div>');
    var cell_id_span = $('<span class="cell-id"></span>');
    cell_id_span.text('In ' + cell_id + '');
    cell.append(cell_id_span);
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
