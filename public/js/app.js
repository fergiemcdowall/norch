var hit = Handlebars.compile($("#hit").html());
var facet = Handlebars.compile($("#facet").html());
var filterTemplate = Handlebars.compile($("#filter").html());



$("#search").keyup(function(){  
  search(window.location.search.substring(1).replace(/(q=)[^\&]+/,
                                                     '$1' + $('#search').val()));
});


$(document).ready(function() {
  Handlebars.registerHelper('eachProperty', function(context, options) {
    var ret = "";
    for(var prop in context)
      ret = ret + options.fn({property:prop,
                              value:context[prop]});
    return ret;
  });
  search(window.location.search.substring(1));
});


function search(urlParams) {
  console.log(urlParams);
  $.getJSON("http://localhost:3000/search?" + urlParams, function(result){
    $("#resultset").empty();
    $("#facets").empty();
    var activeFilters = 
      decodeURIComponent($.param({filter:result['query']['filter']}));
    var activeFilterArray = [];
    for (var i in result['query']['filter']) {
      var removeFilterLink = 
        urlParams.replace('filter[' + i + '][]='
                          + result['query']['filter'][i], '');
      console.log(removeFilterLink);
      $("#facets").append
      (filterTemplate({filter: i,
                       filterValue: result['query']['filter'][i],
                       removeLink: removeFilterLink
                      }));
      activeFilterArray.push(i);
    }
    for (var i = 0; i < result['hits'].length; i++) {
      $("#resultset").append(hit({hit: result.hits[i].document}));
    }
    for (var i in result['facets']) {
      if (activeFilterArray.indexOf(i) == -1) {
        if (Object.keys(result.facets[i]).length > 0) {
          $("#facets").append(facet({'facet': result.facets[i],
                                     'name': i,
                                     'url': urlParams + '&filter[' + i + '][]='
                                    }));
        
        }
      }
    }
  });
}


function getURLParam(name, url) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(url);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}

