var hit = Handlebars.compile($("#hit").html()),
    facet = Handlebars.compile($("#facet").html()),
    filterTemplate = Handlebars.compile($("#filter").html());



$("#search").keyup(function(){
  var params = window.location.search.substring(1);
  if (params.indexOf('q=') === -1) {
    params += 'q=ussr';
  }
  if ($('#search').val() !== '') {
    search(params.replace(/(q=)[^\&]+/, '$1' + $('#search').val()));
  }
});


$(document).ready(function() {
  Handlebars.registerHelper('eachProperty', function(context, options) {
    var ret = "",
        prop,
        urlParams;
    for(prop in context)
      ret = ret + options.fn({property:prop,
                              value:context[prop]});
    return ret;
  });
  urlParams = window.location.search.substring(1);
  if (urlParams !== '') {
    search(urlParams);
  }
});


function search(urlParams) {
  console.log(urlParams);
  var activeFilters,
      activeFilterArray,
      removeFilterLink;
  $.getJSON("/search?" + urlParams, function(result){
    var i;
    $("#resultset").empty();
    $("#facets").empty();
    $("#resultSetStrapLine").empty();
    if (result.totalHits > 0) {
      $("#resultSetStrapLine").html('<h4>' + result.totalHits
                                    + ' hits</h4>');
    }
    activeFilters = 
      decodeURIComponent($.param({filter:result['query']['filter']}));
    activeFilterArray = [];
    for (i in result['query']['filter']) {
      removeFilterLink = 
        urlParams.replace('&filter[' + i + '][]='
                          + result['query']['filter'][i], '');
      console.log(removeFilterLink);
      $("#facets").append
      (filterTemplate({filter: i,
                       filterValue: result['query']['filter'][i],
                       removeLink: removeFilterLink
                      }));
      activeFilterArray.push(i);
    }
    for (i = 0; i < result['hits'].length; i++) {
      $("#resultset").append(hit({hit: result.hits[i].document}));
    }
    for (i in result['facets']) {
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
  var regexS = "[\\?&]" + name + "=([^&#]*)",
      regex = new RegExp(regexS),
      results = regex.exec(url);
  if(results === null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}
