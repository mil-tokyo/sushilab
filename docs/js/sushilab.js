'use strict';
(function () {
  $(function () {
    window.onerror = onerror_function;
    // $("#add-cell").click(function () {
    //   add_cell();
    // });

    $("#new-notebook").click(function () {
      // remove "loadurl=*" from current url
      var new_url = location.href;
      new_url = new_url.replace(/\?loadurl=([^&#]*)/, '');//TODO: inaccurate
      window.open(new_url);
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

    $("#export-notebook").click(function () {
      var name = $("#export-name").val();
      export_notebook(name);
    });

    $("#import-notebook").click(function (e) {
      var name = $("#export-name").val();
      if (name.length == 0) {
        alert('Please specify a name to store the notebook in the Name box');
        return false;
      }
      var files = $("#import-notebook-file")[0].files;
      if (files.length > 0) {
        var f = files[0];
        var reader = new FileReader();
        reader.onload = function (t) {
          var json_text = t.target.result;
          localStorage.setItem('notebook-' + name, json_text);
          $("#load-notebook").trigger('click');
        }
        reader.readAsText(f);
      }
    });

    var load_name = sessionStorage.getItem('load_name');
    if (load_name) {
      sessionStorage.removeItem('load_name');
      console.log('loading notebook ' + load_name);
      load_notebook(load_name);
    } else {
      var load_regex = new RegExp("[\\?&]loadurl=([^&#]*)");
      var load_regex_match = load_regex.exec(window.location.href);
      if (load_regex_match) {
        loadurl_notebook(load_regex_match[1]);
      } else {
        add_cell(true);
      }
    }
  });

  $(document).on('keydown', 'textarea.cell', function (e) {
    if (e.shiftKey && e.keyCode === 13) {
      var textarea_cell_dom = this;
      var textarea_cell = $(textarea_cell_dom);

      var div_cell = textarea_cell.parents("div.cell");
      var cell_id = Number(div_cell.data('input-cell-id'));
      exec_cell(cell_id);
      return false;
    }
  });

  function exec_cell(cell_id) {
    var input_cell_div = $("div[data-input-cell-id='" + cell_id + "']");
    var textarea_cell = input_cell_div.children("textarea");
    var input_script = textarea_cell.val();
    input_cell_div.addClass('executedcell');

    var div_result = $("div[data-output-cell-id='" + cell_id + "']");
    var new_result_cell = false;
    if (div_result.length == 0) {
      // create new result cell
      new_result_cell = true;
      div_result = $('<div class="result"></div>');
      div_result.attr('data-output-cell-id', cell_id.toString());
      input_cell_div.after(div_result);
    } else {
      // empty and reuse existing cell
      div_result.empty();
    }
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

    if (new_result_cell) {
      add_cell(focus);
    } else {
      // focus on next cell
      $("div[data-input-cell-id='" + (cell_id + 1) + "']").children("textarea").focus();
    }

  }

  var next_cell_id = 1;
  function add_cell(focus) {
    var cell_id = next_cell_id;
    next_cell_id++;
    var textarea = $('<textarea class="cell" rows="4" cols="80"></textarea>');
    var cell = $('<div class="cell" data-input-cell-id="' + cell_id + '"></div>');
    var cell_id_span = $('<span class="input-cell-id"></span>');
    cell_id_span.text('In ' + cell_id + '');
    cell.append(cell_id_span);
    cell.append(textarea);
    $("#cells").append(cell);
    if (focus) {
      textarea.focus();
    }
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
    var notebook_obj = JSON.parse(import_json);
    parse_notebook_json(notebook_obj);
    add_cell(false);
    $("div[data-input-cell-id='1']").children("textarea").focus();
    return true;
  }

  function loadurl_notebook(url) {
    var loading_text = $('<div>Loading notebook from network...</div>');
    $("#cells").append(loading_text);
    $.getJSON(url, function (notebook_obj) {
      loading_text.remove();
      parse_notebook_json(notebook_obj);
      add_cell(false);
      $("div[data-input-cell-id='1']").children("textarea").focus();
    });
  }

  function parse_notebook_json(notebook_obj) {
    var cells = notebook_obj['cells'];

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

  function export_notebook(name) {
    var json_str = localStorage.getItem('notebook-' + name);
    if (!json_str) {
      alert('Save notebook first');
      return false;
    }

    var blob = new Blob([json_str], { "type": "application/json" });
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var a = document.createElement('a');
    a.download = 'notebook.json';
    a.href = url;
    var a_jq = $(a);
    $("body").append(a_jq);//maybe needed
    a.click();
    a_jq.remove();

    return true;
  }

})();
