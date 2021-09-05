import { Button } from '@chakra-ui/button';
import { Input } from '@chakra-ui/input';
import { StackDivider, VStack, Box } from '@chakra-ui/layout';
import { 
	Drawer, DrawerBody, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerOverlay, DrawerFooter,
	HStack, Center, InputGroup, InputLeftAddon, Text 
} from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import * as requests from '../../helpers/request';
import Player from '../Player';
import ItemList from '../ItemList';
import { constants } from '../../constants';

// (maybe object of arrays with a key for each, and we know what tab we're on.. or something)

// search
// playlist
// context menu
const MainPanel = () => {
	// api
	const [server, setServer] = useState(constants.serverOrigin);

	// audio stuff
	const [currentlyPlaying, setCurrentlyPlaying] = useState({});
	const [audioSrc, setAudioSrc] = useState('');
	
	// library 
	const [library, setLibrary] = useState([]);
	const [musicDir, setMusicDir] = useState('D:/Users/Jorta/Music');
	const [selectedAlbum, setSelectedAlbum] = useState({});
	const [selectedSong, setSelectedSong] = useState({});
	const [playlist, setPlaylist] = useState([]);

	// display
	const itemsIncrement = 9;
	const [numItems, setNumItems] = useState(itemsIncrement);
	const [isLoading, setIsLoading] = useState(true);

	const getAlbums = () => {
		setIsLoading(true);
		return requests.get('music/getAllArtists');
	};

	useEffect(() => {
		requests.setApi(server);
		getAlbums().then(res => {
			setLibrary(res.data);
		}).catch(error => {
			console.error(error);
		}).finally(() => {
			setIsLoading(false);
		});
	}, []);

	useEffect(() => {
		requests.get('music/getAllArtists', {})
		.then(res => {
			setLibrary(res.data);
		}).catch(console.error);
	}, []);

	const onInfiniteScrollBottom = () => {
		setNumItems((currentItems) => currentItems + itemsIncrement);
	};

	const buildLibrary = () => {
		setIsLoading(true);
		requests.get('library/build', { musicDir: musicDir })
		.then(res => {
			setLibrary(res.data);
		}).catch(console.error)
		.finally(() => {
			setIsLoading(false);
		});
	};

	const onClickAlbum = (item) => {
		console.log('clicked album ->', item);
		setSelectedAlbum(item);
	};

	const onClickSong = (item) => {
		console.log('clicked song =>', item);
		setSelectedSong(item);

		// todo: remove or rethink this
		requests.get('music/getSong', { path: item.Path }, 'blob')
		.then(res => {
			const format = res.headers['content-type'];
			const track = new Blob([res.data], { type: format });
			const trackURL = window.URL.createObjectURL(track);
			setAudioSrc(trackURL);
		}).catch(console.error);
	};

	const onChangeApi = (value) => {
		setServer(value);
		requests.setApi(value);
	};

	// todo: the next thing you need to look at is fixing infinite scrolling
	return (
		<Box>
			<HStack spacing={'2'} margin={'4'}>
				<Text>Server</Text>
				<InputGroup size={'sm'}>
					<InputLeftAddon children={'http://'} />
					<Input maxW={'30%'} placeholder={constants.server} value={server} onChange={(event) => onChangeApi(event.target.value)}/>
				</InputGroup>
				<Text>Music Root:</Text>
				<Input maxW={'30%'} size={'sm'} type={'text'} value={musicDir} onChange={(event) => setMusicDir(event.target.value)}/>
				<Button size={'sm'} onClick={buildLibrary} margin={'4'}>Build</Button>
				<Button size={'sm'} onClick={getAlbums} margin={'4'}>Manual Get</Button>
			</HStack>
			{isLoading &&
				<Box w={'100vw'} h={'100vh'}>
					<Center>
						<Text align={'center'}>
							Loading...
						</Text>
					</Center>
				</Box>
			}
			{!isLoading && library.length === 0 &&
				<Box w={'100vw'} h={'100vh'}>
					<Center>
						<Text align={'center'}>
							Library failed to load, or is empty.<br />
							Check server is running at http://{server} and that your music root is correct.
						</Text>
					</Center>
				</Box>
			}
			{!isLoading && library.length > 0 &&
				<Box overflow={'auto'}>
					<VStack
						align={'stretch'}
						divider={<StackDivider borderColor={'gray.200'}/>}
						spacing={4}
					>
						<ItemList
							infiniteScroll
							items={library}
							itemKey={'Path'}
							onClickItem={onClickAlbum}
							onInfiniteScrollBottom={onInfiniteScrollBottom}
						/>
						<Player
						currentlyPlaying={selectedSong}
						source={audioSrc}
						/>
					</VStack>
				</Box>
			}
			{selectedAlbum.Title !== undefined &&
				<Drawer isOpen={selectedAlbum.Title !== undefined} placement={'right'} onClose={() => { setSelectedAlbum({}) }} size={'sm'}>
					<DrawerOverlay />
					<DrawerContent>
						<DrawerCloseButton />
						<DrawerHeader>
							{selectedAlbum.Title || 'No Title available'}
						</DrawerHeader>
						<DrawerBody>
							<VStack divider={<StackDivider borderColor={'gray.200'}/>}>
								{Object.keys(selectedAlbum.Songs).map(key => {
									const song = selectedAlbum.Songs[key];
									return (
										<Box key={key}>
											<Text appearance={'button'} fontWeight={'semibold'} maxW={'100%'} onClick={() => { onClickSong(song) }}>
												{song.Tracknumber ? `${song.Tracknumber}.` : ''} {song.Title || song.Path}
											</Text>
										</Box>
									);
								})}
							</VStack>
						</DrawerBody>
						<DrawerFooter />
					</DrawerContent>
				</Drawer>
			}
		</Box>
	);
};

export default MainPanel;