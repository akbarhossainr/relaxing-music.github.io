/**
* Author: Saddam Hossain
* Email: thedevsaddam@gmail.com
**/

var BASE_URL = 'https://api.github.com/';
var REPOSITORY_ENDPOINT = 'users/relaxing-music/repos';
var REPOSITORY_DETAILS = 'repos/relaxing-music/';

    //ucfirst function
    String.prototype.ucfirst = function()
    {
        return this.charAt(0).toUpperCase() + this.substr(1);
    }

  // fetch all repositories from git
  function fetchRepositories(page){
      if(!page){
          page = 1;
      }
    var repositories = [];
    var dfrd = $.Deferred();
    $.get(BASE_URL+REPOSITORY_ENDPOINT + '?page=' + page + "&per_page=100",
    function(response){
      $.each( response, function( key, value ) {
          names = value.name.split("-");
          if( "sound" === names[0]){
            repositories.push(value.name);
          }
      });
      dfrd.resolve(repositories);
    })
    return $.when(dfrd).done(function(repos){
    }).promise();

  }

  // fetch all songs from git
  function fetchSongs(repository){
    var songs = [];
    var dfrd = $.Deferred();
    $.get(BASE_URL+REPOSITORY_DETAILS+repository+'/contents?ref=master',
    function(response){
      $.each( response, function( key, value ) {
          songs.push({
            'name' : value.name,
            'url' : 'https://rawgit.com/relaxing-music/' + repository + '/master/' + value.name,
            'cdn_url': 'https://cdn.rawgit.com/relaxing-music/' + repository + '/master/' + value.name,
            'raw_url': 'https://rawgit.com/relaxing-music/' + repository + '/master/' + value.name,
            'title': value.name.replace(new RegExp('_', 'g'), ' ').ucfirst(),
            'extension' : value.name.split('.').pop()
          });
        });
        dfrd.resolve(songs);
    });
    return $.when(dfrd).done(function(songs){
    }).promise();

  }


  function getTransformedRepositories(page){
      var _repos = [];
      if(localStorage.getItem("repositories")){
          _repos = JSON.parse(localStorage.getItem("repositories"));
      }else{
          _repos = [];
      }

      if($.isEmptyObject(_repos)){

          if(!page){page = 1;}

          fetchRepositories(page).done(function(repos){
              var obj_repositorylist = {};
              obj_repositorylist["page_"+page] = repos;
              localStorage.setItem("repositories", JSON.stringify(obj_repositorylist));
            });
      }
      $.each(_repos, function(key, value){
          if(key=="page_"+page){
              _repos = value
              return false;
          }
      })
      return _repos;
  }

  function getTransformedSongs(repository_name){
      var _songs = [] ;
      var playlist = [];
      if(localStorage.getItem("songs")){
          _songs = JSON.parse(localStorage.getItem("songs"));
      }else{
          _songs = [];
      }

      if($.isEmptyObject(_songs)){
          fetchSongs(repository_name).done(function(songs){
                $.each(songs, function(key, value){
                    playlist.push({mp3: value.url, title: value.title});
                });
                var obj_playlist = {};
                obj_playlist[repository_name] = playlist;
                localStorage.setItem("songs", JSON.stringify(obj_playlist));
            });
      }
      $.each(_songs, function(key, value){
          if(key==repository_name){
              _songs = value
              return false;
          }
      })
    return _songs;
  }

function fetchCachedRepositories(page){
    var _repos = [];
    if(localStorage.getItem("repositories")){
        _repos = JSON.parse(localStorage.getItem("repositories"));
        $.each(_repos, function(key, value){
            if("page_"+page == key){
                _repos = value;
                return false;
            }
        });
    }
    return _repos;
}

function cacheRepositories(page, repositories){
    var _repos = [];
    if(localStorage.getItem("repositories")){
        _repos = JSON.parse(localStorage.getItem("repositories"));
    }
    var obj_repositorylist = {};
    $.each(_repos, function(key, value){
        obj_repositorylist[key] = value;
    });
    obj_repositorylist["page_"+page] = repositories;
    localStorage.setItem("repositories", JSON.stringify(obj_repositorylist));
}


function isAlbumInCache(album_name){
  var _songs_ = [];
  if(localStorage.getItem("songs")){
      _songs = JSON.parse(localStorage.getItem("songs"));
      $.each(_songs, function(key, value){
        if(album_name == key){
          _songs_ = value;
          return false;
        }
      });
  }
  return _songs_;
}

function cacheAlbum(album_name, album_value){
  if($.isEmptyObject(isAlbumInCache(album_name))){
    var _songs = [];
    if(localStorage.getItem("songs")){
        _songs = JSON.parse(localStorage.getItem("songs"));
    }
    var song_objplaylist = {};
    $.each(_songs, function(key, value){
        song_objplaylist[key] = value;
    });
    song_objplaylist[album_name] = album_value;
    localStorage.setItem("songs", JSON.stringify(song_objplaylist));
  }
}

function audio_player(playlist){
    return new jPlayerPlaylist({
                jPlayer: "#jquery_jplayer",
                cssSelectorAncestor: "#jp_container"
            },
            playlist,
          {
                autoPlay: true,
                swfPath: "src/player/jplayer",
                supplied: "oga, mp3",
                wmode: "window",
                useStateClassSkin: true,
                autoBlur: false,
                smoothPlayBar: false,
                keyEnabled: true,
                // errorAlerts:true //disabled in productions
            });
}

//sleep function
function sleep(ms) {
  return new Promise(function(resolve){
      return setTimeout(resolve, ms);
  });
}

$(document).ready(function(){
    // set cache time
    var stime = Math.floor(new Date().getTime()/1000);
    localStorage.setItem('cache_stime', stime);
    setInterval(function(){ destroy(); }, 2000);
    function destroy(){
        var expire = 3550; //3550 // expire 59 minute;
        var etime = Math.floor(new Date().getTime()/1000);
        var _stime = localStorage.getItem('cache_stime');
        if((etime-_stime)>expire){
            localStorage.setItem('repositories', JSON.stringify({}));
            localStorage.setItem('songs', JSON.stringify({}));
        }
    }

    //player
    var cached_repositories = fetchCachedRepositories(1);

    if($.isEmptyObject(cached_repositories)){
        fetchRepositories(1).done(function(repositories){
            if($.isEmptyObject(isAlbumInCache(repositories[0]))){
                fetchSongs(repositories[0]).done(function(songs){
                    var playlist = [];
                        $.each(songs, function(key, value){
                            playlist.push({mp3: value.url, title: value.title});
                        });

                    populateAlbumDropdown(repositories);
                    $(".loader-overlay").fadeOut('slow');
                    //play music
                    audio_player(playlist);
                    //set title
                    $("#jquery_jplayer").bind($.jPlayer.event.play, function(event) {
                      $("#current-track").html(event.jPlayer.status.media.title);
                    });
                    //cache the albums
                    cacheAlbum(repositories[0], songs);
                });
            }else{
                var songs = isAlbumInCache(repositories[0]);
                var playlist = [];
                    $.each(songs, function(key, value){
                        playlist.push({mp3: value.url, title: value.title});
                    });
                $(".loader-overlay").fadeOut('slow');
                //play music
                audio_player(playlist);
                //set title
                $("#jquery_jplayer").bind($.jPlayer.event.play, function(event) {
                  $("#current-track").html(event.jPlayer.status.media.title);
                });
            }
            //cache the repositories
            cacheRepositories(1, repositories);
        });
    }else{
        var repositories = getTransformedRepositories(1);
        var songs = getTransformedSongs(repositories[0]);
        populateAlbumDropdown(repositories);
        var playlist = [];
            $.each(songs, function(key, value){
                playlist.push({mp3: value.url, title: value.title});
            });
        $(".loader-overlay").fadeOut('slow');
        //play music
        audio_player(playlist);
        //set title
        $("#jquery_jplayer").bind($.jPlayer.event.play, function(event) {
          $("#current-track").html(event.jPlayer.status.media.title);
        });
    }
});
