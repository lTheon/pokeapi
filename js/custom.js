/// <reference path="jquery-1.11.3.js" />

//******************FUNCTIONS************
//***************************************


//-------------FIRST LETTER CAPITALIZE
String.prototype.ucfirst = function () {
    return this.charAt(0).toUpperCase() + this.substr(1);
}
//------------------------------------

function changeStats(object) {
    $("#pokeImg").attr("src", "img/" + object.attr("name") + ".png");
    $("#HP").html(object.attr("hp"));
    $("#atk").html(object.attr("attack"));
    $("#def").html(object.attr("defense"));
    $("#sp_atk").html(object.attr("special-attack"));
    $("#sp_def").html(object.attr("special-defense"));
    $("#speed").html(object.attr("speed"));
    $("#type").html("");
    for (var i = 0; i < object.attr("type").split(";").length; i++) {
        var typeDiv = $("<div>").addClass(object.attr("type").split(";")[i])
            .html(object.attr("type").split(";")[i]);
        $("#type").append(typeDiv);
    }
}

function processJSON(json) {
    var namesArray = [];
    var object = json.chain;
    while (true) {
        var joined_string = object.species.name;
        if (object.evolves_to[0] == undefined) {
            namesArray.push(joined_string);
            break;
        }
        else {
            if (object.evolves_to[0].evolution_details[0].trigger.name == "level-up" && object.evolves_to[0].evolution_details[0].min_level != null)
                joined_string += ";Level up (" + object.evolves_to[0].evolution_details[0].min_level + ")";
            else if (object.evolves_to[0].evolution_details[0].trigger.name == "use-item")
                joined_string += ";" + object.evolves_to[0].evolution_details[0].item.name.replace("-", "");
            else
                joined_string += ";Level up</br>Special conditions";
        }
        namesArray.push(joined_string);
        object = object.evolves_to[0];
    }
    return namesArray;
}
function checkWhenEvoBegins(table, column) {
    for (var i = 0; i < table.length; i++) {
        if (table[column][i].hasClass("evoWrap")) {
            return i;
        }
    }
}
function buildSite(objects) {
    var pageDiv;
    var pageNumber = 0;
    for (var i = 0; i < objects.length; i++) {
        if (i % 3 == 0) {
            pageNumber++;
            var numberDiv = $("<div>").html(pageNumber)
                .addClass("pageButtons")
            $("#pagination").append(numberDiv);
            pageDiv = $("<div>").attr("page", pageNumber)
            if(pageNumber!=1)
                pageDiv.css("display", "none");
            $("#table").append(pageDiv);

        }
        wrappingDiv = $("<div>").addClass("wrappingDiv");

        var evoDivsStart = checkWhenEvoBegins(objects, i);
        for (var j = 0; ; j++) {
            wrappingDiv.append(objects[i][j]);
            if (objects[i][j + 1] == undefined || objects[i][j + 1].hasClass("evoWrap")) {
                pageDiv.append(wrappingDiv);
                break;
            }
            else
                wrappingDiv.append(objects[i][j+evoDivsStart]);

        }
    }
    $(".pageButtons").click(function () {
        $("div[page=" + currentPage + "]").css("display", "none");
        $("div[page=" + $(this).html() + "]").css("display", "block");
        currentPage = $(this).html();
    })
        .mouseenter(function () {
            $(this).animate().stop();
            $(this).animate({ backgroundColor: "#F08030" }, 200);
    })
        .mouseleave(function () {
            $(this).animate().stop();
            $(this).animate({ backgroundColor: "#b6aeae" }, 200);
        })
    $('#load_screen').animate({ opacity: 0 }, 500);
    setTimeout(function () {
        clearInterval(blinkInterval);
        $("#load_screen").remove();
    }, 500);
}
//************************************************
//**************END OF FUNCTIONS******************
//************************************************

//-----------GLOBAL VARIABLES---------------
var currentPage = 1;
var blinkInterval;
//------------------------------------------


$(document).ready(function () {

    //PRE SETTINGS**********
    var pokemon_count = 15;
    var objects_in_row = 5;
    
    var integrityCheck = 0; //CHECK IF ALL INFO WAS DOWNLOADED AND PROCESSED --- VALUE INCREASED BY NUMBER OF 'NAMES' IN TAB AND DECREASED AFTER INNER LOOP --- SHOULD EQUAL 0 IN THE END
    //**********************
    
    blinkInterval=setInterval(function (){
        $("#loading_text").animate({ opacity: 0 }, 250);
        setTimeout(function () {
            $("#loading_text").animate({ opacity: 1 }, 250);
        }, 250)
    },500)

    var objectsArray = new Array(pokemon_count);
    for (var i = 0; i < objectsArray.length;i++){
        objectsArray[i] = new Array(objects_in_row);
    }
    for (var i = 1; i <= pokemon_count; i++) {
        $.ajax({
            url: 'http://pokeapi.co/api/v2/evolution-chain/'+i,
            dataType: 'json',
            type: 'GET',
            iteration: i,
            success: function (res) {
                var names = processJSON(res);
                integrityCheck += names.length;
                for (var j = 0; j < names.length; j++) {
                    $.ajax({
                        url: 'http://pokeapi.co/api/v2/pokemon/' + names[j].split(";")[0],
                        dataType: 'json',
                        type: 'GET',
                        inner_names: names,
                        inner_iteration: j,
                        outer_iteration: this.iteration,
                        success: function (inner_res) {
                            //-------------------------------------------------------
                            var statsTable = inner_res.stats;
                            var pokemonDiv = $("<div>").addClass("inlineDiv")
                                .addClass("media_change")
                                .mouseenter(function () { changeStats($(this)) })
                                //FOR MOBILE
                                .click(function () { changeStats($(this)) })
                                .attr("name", this.inner_names[this.inner_iteration].split(";")[0].ucfirst());

                            var typeString = '';
                            var pokemonTypeWrap = $("<div>");
                            for (var x = 0; x < inner_res.types.length; x++) {
                                typeString += inner_res.types[x].type.name.ucfirst();
                                if (inner_res.types[x + 1] != undefined)
                                    typeString += ";";
                                var pokemonType = $("<div>").html(inner_res.types[x].type.name.ucfirst())
                                    .addClass("inlineDiv")
                                    .addClass(inner_res.types[x].type.name.ucfirst())
                                    .addClass("types");
                                pokemonTypeWrap.append(pokemonType);
                                
                            }
                            pokemonDiv.attr("type", typeString);

                            var HPStat; //FOR SHORT INFO
                            for (var x = 0; x < statsTable.length; x++) {
                                pokemonDiv.attr(statsTable[x].stat.name, statsTable[x].base_stat);
                                if (statsTable[x].stat.name == "hp")
                                    HPStat = statsTable[x].base_stat;
                            }
                            var pokemonImg = $("<img>").attr("alt", "image")
                                .attr("src", "img/" + this.inner_names[this.inner_iteration].split(";")[0].ucfirst() + ".png")
                                .addClass("pokeImg");
                            var pokemonName = $("<div>").html(this.inner_names[this.inner_iteration].split(";")[0].ucfirst()).css("font-weight", "bold");

                            var pokemonHPWrap = $("<div>")
                                .addClass("HPwrap");
                            var pokemonHPCaption = $("<div>").html("HP")
                                .addClass("inlineDiv")
                                .addClass("HPcapt");
                            var pokemonHPNumbers = $("<div>").html(HPStat)
                                .addClass("inlineDiv")
                                .addClass("HPnums");
                            pokemonHPWrap.append(pokemonHPCaption)
                                .append(pokemonHPNumbers);

                            pokemonDiv.append(pokemonImg)
                                .append(pokemonName)
                                .append(pokemonHPWrap)
                                .append(pokemonTypeWrap)
                                .addClass("pokeDiv");
                            
                            objectsArray[this.outer_iteration-1][this.inner_iteration] = pokemonDiv;
                            //-------------------------------------------------------------------

                            if (this.inner_iteration < this.inner_names.length - 1) {
                                var evoWrap = $("<div>").addClass("inlineDiv")
                                    .addClass("evoWrap");
                                var evoDiv = $("<div>");
                                if (this.inner_names[this.inner_iteration].split(";")[1].indexOf("stone") == -1) {
                                    evoDiv.html(this.inner_names[this.inner_iteration].split(";")[1])
                                }
                                else {
                                    var stoneImg = $("<img>").attr("alt", "image")
                                        .attr("src", "img/" + this.inner_names[this.inner_iteration].split(";")[1].ucfirst() + ".png")
                                        .attr("title", this.inner_names[this.inner_iteration].split(";")[1].ucfirst())
                                        .addClass("stone");
                                    evoDiv.append(stoneImg);
                                }
                                var indicator = $("<div>").html("---->")
                                    .addClass("horiz_indicator");
                                evoWrap.append(evoDiv)
                                    .append(indicator);

                                //---VERTICAL ARROW
                                var indicator_vert = $("<div>").html("|<br>V")
                                    .addClass("vert_indicator");
                                evoWrap.append(indicator_vert);
                                objectsArray[this.outer_iteration - 1][this.inner_iteration + this.inner_names.length] = evoWrap;
                                
                            }


                            integrityCheck--
                            if (integrityCheck == 0)
                                buildSite(objectsArray);
                        }
                    })
                }
            }
        });
    }
});