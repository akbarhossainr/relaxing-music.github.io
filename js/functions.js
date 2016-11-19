function populateAlbumDropdown(repositories)
{
    var list = '';
    for (var i = 0; i < repositories.length; i++) {
      var album_name = (repositories[i]).split('sound-')[1];
      list += '<option value="' + repositories[i] + '">' + album_name + '</option>';
    }
    $("#album_repository_list").html(list);
}

$(document).ready(function(){

  $("#album_repository_list").change(function(e){
    $(".loader-overlay").fadeIn('fast');
    var album_repo_name=$(this).val();
    var onChangePlaylist = [];
    if($.isEmptyObject(isAlbumInCache(album_repo_name))){
      fetchSongs(album_repo_name).done(function(songs){
        var playlist = [];
            $.each(songs, function(key, value){
                playlist.push({mp3: value.url, title: value.title});
            });
            cacheAlbum(album_repo_name, songs);
            onChangePlaylist = playlist;
            audio_player(onChangePlaylist).setPlaylist(onChangePlaylist);
            $("#jquery_jplayer").bind($.jPlayer.event.play, function(event) {
              $("#current-track").html(event.jPlayer.status.media.title);
            });
            $(".loader-overlay").fadeOut('slow');
      });

    }else{
        var songs = isAlbumInCache(album_repo_name);
        var playlist = [];
            $.each(songs, function(key, value){
                playlist.push({mp3: value.url, title: value.title});
            });
        audio_player(playlist).setPlaylist(playlist);
        $("#jquery_jplayer").bind($.jPlayer.event.play, function(event) {
          $("#current-track").html(event.jPlayer.status.media.title);
        });
        $(".loader-overlay").fadeOut('slow');
    }

    // pause the playing song if shuffled
    $("#jquery_jplayer").bind($.jPlayer.event.shuffle, function() {
        $.jPlayer.event.pause();
    });

  });




});
