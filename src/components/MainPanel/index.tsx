import { useState, useEffect, FC } from 'react';
import { StackDivider, VStack, Box, StackItem } from '@chakra-ui/layout';
import { Center, Text } from '@chakra-ui/react';
import * as requests from '../../helpers/request';
import { default as libraryApi } from '../../api/library';
import { default as musicApi } from '../../api/music';
import Player from '../Player';
import ItemList from '../ItemList';
import { constants, contextMenuOptions } from '../../constants';
import LibraryConfig from '../LibraryConfig';
import AlbumDrawer from '../AlbumDrawer';
import Loader from '../Loader';
import { Album, Song, Playable, isAlbum } from '../../types/data/library';

// search

// playlist

// context menu (needs tweaking, but sort of done)
// fixing song meta data / adding meta data

const MainPanel: FC = () => {
  // api
  const [server, setServer] = useState(constants.serverOrigin);

  // library
  const [library, setLibrary] = useState<Album[]>([]);
  const [musicDir, setMusicDir] = useState('D:/Users/Jorta/Music');
  const [selected, setSelected] = useState<{} | Album>({});
  const [contextMenu, setContextMenu] = useState(() => contextMenuOptions);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [shouldStartPlaying, setShouldStartPlaying] = useState(false);

  // display
  const [isLoading, setIsLoading] = useState(true);
  const [isAlbumDrawerOpen, setAlbumDrawerOpen] = useState(false);


  useEffect(() => {
    requests.setApi(server);
    // this should be a seperate function
    // todo: async
    musicApi.getAllArtists().then(data => {
      setLibrary(data);
    }).catch(error => {
      console.error(error);
    }).finally(() => {
      setIsLoading(false);
    });

    setContextMenu((contextMenu) => {
      return {
        play: { ...contextMenu.play, action: onPlay },
        playNext: { ...contextMenu.playNext, action: onPlayNext },
        addToQueue: { ...contextMenu.addToQueue, action: onAddToQueue }
      };
    });
  }, [server]);

  // todo: async
  const buildLibrary = () => {
    setIsLoading(true);
    libraryApi.build(musicDir)
      .then(data => {
        setLibrary(data);
      }).catch(console.error)
      .finally(() => {
        setIsLoading(false);
      });
  };

  const onClickAlbum = (item: Album) => {
    console.log('clicked album ->', item);
    setSelected(item);
    setAlbumDrawerOpen(true);
  };

  const onChangeApi = (value: string) => {
    setServer(value);
    requests.setApi(value);
  };

  const onPlay = (item: Playable) => {
    if (isAlbum(item)) {
      const songs = Object.values(item.Songs);
      setPlaylist(songs);
    } else {
      setPlaylist([item]);
    }
    setSelected({});
    setAlbumDrawerOpen(false);
    setShouldStartPlaying(true);
  };

  const onPlayNext = (item: Playable) => {
    if (isAlbum(item)) {
      const songs = Object.values(item.Songs);
      setPlaylist((playlist) => [...songs, ...playlist]);
    } else {
      setPlaylist((playlist) => [item, ...playlist]);
    }
  };

  const onAddToQueue = (item: Playable) => {
    if (isAlbum(item)) {
      const songs = Object.values(item.Songs);
      setPlaylist((playlist) => [...playlist, ...songs]);
    } else {
      setPlaylist((playlist) => [...playlist, item]);
    }
  };

  const onAlbumDrawerClose = () => {
    setSelected({});
    setAlbumDrawerOpen(false);
  };

  return (
    <Box alignItems='center' marginLeft={[0,4]}>
      <LibraryConfig buildLibrary={buildLibrary} getAllArtists={musicApi.getAllArtists} onChangeApi={onChangeApi}
        musicDir={musicDir} setMusicDir={setMusicDir} server={server} />
      {isLoading &&
        <Loader spinner />
      }
      {!isLoading && library.length === 0 &&
        <Box w="100vw" h="90wh">
          <Center w="100vw" h="90wh">
            <Text align="center" marginTop="15%">
              Library failed to load, or is empty.<br />
              Check server is running at http://{server} and that your music root is correct.
            </Text>
          </Center>
        </Box>
      }
      {/* literally everything below the boxes at the top */}
      {!isLoading && library.length > 0 &&
        <VStack divider={<StackDivider borderColor="gray.200" />} w="95vw" h="90vh" spacing='4'>
          <ItemList items={library} onClickItem={onClickAlbum} contextMenuOptions={contextMenu} selected={selected} setSelected={setSelected} />
          <Player playlist={playlist} setPlaylist={setPlaylist} shouldStartPlaying={shouldStartPlaying} setShouldStartPlaying={setShouldStartPlaying} />
        </VStack>
      }
      <AlbumDrawer contextMenuOptions={contextMenu} isOpen={isAlbumDrawerOpen} selectedAlbum={selected} onClose={onAlbumDrawerClose}
        setSelected={setSelected} />
    </Box>
  );
};

export default MainPanel;
