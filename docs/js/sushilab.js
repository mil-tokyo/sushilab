'use strict';
(function () {
  $(function () {
    window.onerror = onerror_function;
    // $("#add-cell").click(function () {
    //   add_cell();
    // });

    $("#new-notebook").click(function () {
      window.open(location.href);
    });

    $("#load-notebook").click(function () {
      var name = $("#export-name").val();
      sessionStorage.setItem('load_name', name);
      location.reload();
    });

    $("#save-notebook").click(function () {
      var name = $("#export-name").val();
      save_notebook(name);
    });

    var load_name = sessionStorage.getItem('load_name');
    if (load_name) {
      sessionStorage.removeItem('load_name');
      console.log('loading notebook ' + load_name);
      load_notebook(load_name);
    }
    add_cell();
  });

  $(document).on('keydown', 'textarea.cell', function (e) {
    if (e.shiftKey && e.keyCode === 13) {
      var textarea_cell_dom = this;
      var textarea_cell = $(textarea_cell_dom);
      var input_script = textarea_cell.val();

      var div_cell = textarea_cell.parents("div.cell");
      var cell_id = Number(div_cell.data('input-cell-id'));
      var div_result = $('<div class="result"></div>');
      div_result.attr('data-output-cell-id', cell_id.toString());
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
      div_result.append('<span class="output-cell-id">Out ' + cell_id + '</span>');
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
    var cell = $('<div class="cell" data-input-cell-id="' + cell_id + '"></div>');
    var cell_id_span = $('<span class="input-cell-id"></span>');
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

  function load_notebook(name) {
    var import_json = localStorage.getItem('notebook-' + name);
    if (!import_json) {
      alert("Notebook not found");
      return false;
    }
    var import_data = JSON.parse(import_json);
    var cells = import_data['cells'];

    for (var cell_id = 1; ; cell_id++) {
      var cell_data = cells[cell_id];
      if (!cell_data) {
        next_cell_id = cell_id;
        break;
      }
      var textarea = $('<textarea class="cell" rows="4" cols="80"></textarea>');
      textarea.val(cell_data["input_text"]);
      var cell = $('<div class="cell" data-input-cell-id="' + cell_id + '"></div>');
      var cell_id_span = $('<span class="input-cell-id"></span>');
      cell_id_span.text('In ' + cell_id + '');
      cell.append(cell_id_span);
      cell.append(textarea);
      $("#cells").append(cell);

      $("#cells").append($(cell_data["output_html"]));
    }

    return true;
  }

  function save_notebook(name) {
    var cells = {};

    for (var cell_id = 1; cell_id < next_cell_id - 1; cell_id++) {
      var input_text = $('[data-input-cell-id="' + cell_id + '"]').children('textarea').val();
      var output_html = $('[data-output-cell-id="' + cell_id + '"]').prop('outerHTML');
      cells[cell_id] = { "input_text": input_text, "output_html": output_html };
    }

    var export_data = { "cells": cells };
    localStorage.setItem('notebook-' + name, JSON.stringify(export_data));
    alert('Saved notebook ' + name);
  }

})();
