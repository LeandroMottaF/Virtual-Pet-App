import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  PanResponder,
  Animated,
  AppState,
  ActivityIndicator,
} from 'react-native';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  PET_SPRITES,
  PET_CLICK_SPRITES,
  PET_CRYING_SPRITES,
  PET_SPECIAL_SPRITES,
  PET_EATING_SPRITES,
  MEAT_ICON_ASSET,
  POOP_SPRITES,
  BROOM_SPRITES,
  BROOM_ICON_ASSET,
  MAP_ASSETS,
  PET_REFUSE_SPRITES,
} from './assets';
import PetStatusModal, { PetData } from './petstatusmodal';
import ShopModal from './shopmodal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const INITIAL_X = Math.floor(SCREEN_WIDTH * 0.35);
const INITIAL_Y = Math.floor(SCREEN_HEIGHT * 0.25);

type PetType = 'momoxi' | 'olho';

interface GameMapScreenProps {
  selectedPet?: PetType;
  onRestartGame?: () => void;
}

const WALK_ANIM_SPEED = 200;    
const BLINK_ANIM_SPEED = 200;   
const ACTION_ANIM_SPEED = 175;
const CRYING_ANIM_SPEED = 225;  

const SPECIAL_ANIM_INTERVAL = 60000;


const MS_PER_HUNGER_POINT = 288000;


const MS_STARVATION_DEATH = 86400000;


const MS_PER_POOP = 14400000;

const MS_PER_OFFLINE_COIN = 3600000;

interface PoopItem {
  id: number;
  x: number;
  y: number;
}

export default function GameMapScreen({
  selectedPet = 'momoxi',
  onRestartGame,
}: GameMapScreenProps) {
  const currentPetSprites = PET_SPRITES[selectedPet] || PET_SPRITES.momoxi;
  const currentClickSprites = PET_CLICK_SPRITES[selectedPet] || PET_CLICK_SPRITES.momoxi;
  const currentCryingSprites = PET_CRYING_SPRITES[selectedPet] || PET_CRYING_SPRITES.momoxi;
  const currentSpecialSprites = PET_SPECIAL_SPRITES[selectedPet] || [];
  const currentEatingSprites = PET_EATING_SPRITES[selectedPet] || [];
  const currentRefuseSprites = PET_REFUSE_SPRITES[selectedPet] || [];

  const [gameState, setGameState] = useState<'NAME_PET' | 'PLAYING' | 'GAME_OVER'>('NAME_PET');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [petActionState, setPetActionState] = useState<'IDLE' | 'CLICKING' | 'CRYING' | 'EAT' | 'REFUSE'>('IDLE');
  const [petName, setPetName] = useState('');

  const [isShopOpen, setIsShopOpen] = useState(false);
  const [meatCount, setMeatCount] = useState(3);
  const [coins, setCoins] = useState(50);
  const [isDraggingMeat, setIsDraggingMeat] = useState(false);

  const meatCountRef = useRef(meatCount);
  useEffect(() => {
    meatCountRef.current = meatCount;
  }, [meatCount]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPet, setCurrentPet] = useState<PetData>({
    id: 'pet_1',
    name: '',
    type: selectedPet,
    hunger: 100,
    friendshipExp: 0,
    friendshipLevel: 0,
  });

  const islandPets = [currentPet];

  const petHungerRef = useRef(currentPet.hunger);
  useEffect(() => {
    petHungerRef.current = currentPet.hunger;

    if (currentPet.hunger <= 0) {
      if (petActionState !== 'CRYING') {
        setPetActionState('CRYING');
        setFrameIndex(0);
      }
    } else if (petActionState === 'CRYING' && clickCountRef.current < 5) {
      setPetActionState('IDLE');
    }
  }, [currentPet.hunger]);

  const [posX, setPosX] = useState(INITIAL_X);
  const [posY, setPosY] = useState(INITIAL_Y);
  const [dirX, setDirX] = useState<'right' | 'left'>('left');
  const [frameIndex, setFrameIndex] = useState(0);
  const [poops, setPoops] = useState<PoopItem[]>([]);
  const [poopFrameIndex, setPoopFrameIndex] = useState(0);

  const [broomFrameIndex, setBroomFrameIndex] = useState(0);
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepingPos, setSweepingPos] = useState<{ x: number; y: number } | null>(null);

  const [isStaticIdle, setIsStaticIdle] = useState(false);

  const posRef = useRef({ x: INITIAL_X, y: INITIAL_Y });
  const isStaticIdleRef = useRef(isStaticIdle);

  const clickCountRef = useRef(0);
  const resetClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastSpecialTimeRef = useRef<number>(Date.now());

  const pan = useRef(new Animated.ValueXY()).current;
  const meatPanPosition = useRef(new Animated.ValueXY()).current;
  const [isDraggingBroom, setIsDraggingBroom] = useState(false);

  const poopsRef = useRef(poops);
  useEffect(() => {
    poopsRef.current = poops;
  }, [poops]);

  useEffect(() => {
    isStaticIdleRef.current = isStaticIdle;
  }, [isStaticIdle]);

  const generateRandomPoopPosition = (): PoopItem => {
    const treeHitbox = { x: -20, y: 0, width: 180, height: 180 };
    const minX = 60;
    const maxX = SCREEN_WIDTH - 160;
    const minY = 160;
    const maxY = SCREEN_HEIGHT * 0.4;

    let poopX = 0;
    let poopY = 0;
    let isValidPosition = false;
    let attempts = 0;

    const petX = posRef.current.x;
    const petY = posRef.current.y;

    while (!isValidPosition && attempts < 20) {
      attempts++;
      const offsetX = (Math.random() - 0.5) * 120;
      const offsetY = (Math.random() - 0.5) * 120;

      poopX = Math.floor(petX + offsetX);
      poopY = Math.floor(petY + offsetY);

      poopX = Math.max(minX, Math.min(maxX, poopX));
      poopY = Math.max(minY, Math.min(maxY, poopY));

      const poopHitbox = { x: poopX, y: poopY, width: 40, height: 40 };

      const isOverTree =
        poopHitbox.x < treeHitbox.x + treeHitbox.width &&
        poopHitbox.x + poopHitbox.width > treeHitbox.x &&
        poopHitbox.y < treeHitbox.y + treeHitbox.height &&
        poopHitbox.y + poopHitbox.height > treeHitbox.y;

      if (!isOverTree) {
        isValidPosition = true;
      }
    }

    return {
      id: Date.now() + Math.random(),
      x: poopX,
      y: poopY,
    };
  };

  const saveAllGameData = async (
    petDataParam?: PetData,
    coinsParam?: number,
    meatParam?: number,
    poopsParam?: PoopItem[],
    starvationStartParam?: number | null
  ) => {
    try {
      const petToSave = petDataParam || currentPet;

      if (!petToSave.name || petToSave.name.trim().length === 0) {
        return;
      }

      const coinsToSave = coinsParam !== undefined ? coinsParam : coins;
      const meatToSave = meatParam !== undefined ? meatParam : meatCount;
      const poopsToSave = poopsParam !== undefined ? poopsParam : poopsRef.current;

      const fullSaveObject = {
        pet: petToSave,
        coins: coinsToSave,
        meatCount: meatToSave,
        poops: poopsToSave,
        lastSavedTime: Date.now(),
        starvationStartTime: starvationStartParam !== undefined ? starvationStartParam : starvationStartTimeRef.current,
      };

      await AsyncStorage.setItem('@virtual_pet_data', JSON.stringify(fullSaveObject));
    } catch (e) {
      console.error('Erro ao salvar progresso:', e);
    }
  };

  const starvationStartTimeRef = useRef<number | null>(null);

  const loadGameData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('@virtual_pet_data');
      if (savedData !== null) {
        const {
          pet,
          coins: savedCoins,
          meatCount: savedMeat,
          poops: savedPoops,
          lastSavedTime,
          starvationStartTime,
        } = JSON.parse(savedData);

        const now = Date.now();
        const timePassed = now - lastSavedTime;

        const hungerLost = Math.floor(timePassed / MS_PER_HUNGER_POINT);
        const calculatedHunger = Math.max(0, pet.hunger - hungerLost);

        let isDead = false;
        let currentStarvationStart = starvationStartTime || null;

        if (calculatedHunger <= 0) {
          if (!currentStarvationStart) {
            const timeToReachZero = pet.hunger * MS_PER_HUNGER_POINT;
            currentStarvationStart = lastSavedTime + timeToReachZero;
          }

          if (now - currentStarvationStart >= MS_STARVATION_DEATH) {
            isDead = true;
          }
        } else {
          currentStarvationStart = null;
        }

        starvationStartTimeRef.current = currentStarvationStart;

        if (isDead) {
          setGameState('GAME_OVER');
          return;
        }

        setCurrentPet({
          ...pet,
          hunger: calculatedHunger,
        });

        const coinsEarnedOffline = Math.floor(timePassed / MS_PER_OFFLINE_COIN);
        const currentCoins = savedCoins !== undefined ? savedCoins : coins;
        setCoins(currentCoins + coinsEarnedOffline);

        if (savedMeat !== undefined) setMeatCount(savedMeat);

        const existingPoops: PoopItem[] = savedPoops || [];
        const newPoopsCount = Math.floor(timePassed / MS_PER_POOP);

        if (newPoopsCount > 0) {
          const maxPoopsAllowed = Math.max(0, 6 - existingPoops.length);
          const poopsToAdd = Math.min(newPoopsCount, maxPoopsAllowed);

          const generatedOfflinePoops: PoopItem[] = [];
          for (let i = 0; i < poopsToAdd; i++) {
            generatedOfflinePoops.push(generateRandomPoopPosition());
          }
          setPoops([...existingPoops, ...generatedOfflinePoops]);
        } else {
          setPoops(existingPoops);
        }

        if (pet.name && pet.name.trim().length > 0) {
          setGameState('PLAYING');
        }
      }
    } catch (e) {
      console.error('Erro ao carregar progresso:', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadGameData();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadGameData();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        saveAllGameData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [currentPet, coins, meatCount]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const hungerTimer = setInterval(() => {
      setCurrentPet((prev) => {
        const updatedHunger = Math.max(0, prev.hunger - 1);
        const now = Date.now();

        if (updatedHunger <= 0) {
          if (!starvationStartTimeRef.current) {
            starvationStartTimeRef.current = now;
          } else if (now - starvationStartTimeRef.current >= MS_STARVATION_DEATH) {
            setGameState('GAME_OVER');
          }
        } else {
          starvationStartTimeRef.current = null;
        }

        const updatedPet = { ...prev, hunger: updatedHunger };
        saveAllGameData(updatedPet);
        return updatedPet;
      });
    }, MS_PER_HUNGER_POINT);

    return () => clearInterval(hungerTimer);
  }, [gameState]);

  const handleRestartGame = async () => {
    try {
      await AsyncStorage.removeItem('@virtual_pet_data');

      starvationStartTimeRef.current = null;
      setCurrentPet({
        id: 'pet_1',
        name: '',
        type: selectedPet,
        hunger: 100,
        friendshipExp: 0,
        friendshipLevel: 0,
      });
      setPetName('');
      setCoins(50);
      setMeatCount(3);
      setPoops([]);
      setPetActionState('IDLE');

      if (onRestartGame) {
        onRestartGame();
      } else {
        setGameState('NAME_PET');
      }
    } catch (e) {
      console.error('Erro ao reiniciar o jogo:', e);
    }
  };

  useEffect(() => {
    if (poops.length === 0) return;

    const poopInterval = setInterval(() => {
      setPoopFrameIndex((prev) => (prev + 1) % POOP_SPRITES.length);
    }, 450);

    return () => clearInterval(poopInterval);
  }, [poops.length]);

  const triggerBroomAnimation = (poopToClean: PoopItem) => {
    setIsSweeping(true);
    setSweepingPos({ x: poopToClean.x - 28, y: poopToClean.y - 32 });

    let step = 0;
    const sweepInterval = setInterval(() => {
      step++;
      if (step < BROOM_SPRITES.length) {
        setBroomFrameIndex(step);
      } else {
        clearInterval(sweepInterval);

        const updatedPoops = poopsRef.current.filter((item) => item.id !== poopToClean.id);
        setPoops(updatedPoops);

        setCoins((prev) => {
          const updatedCoins = prev + 25;
          saveAllGameData(undefined, updatedCoins, undefined, updatedPoops);
          return updatedCoins;
        });

        setIsSweeping(false);
        setBroomFrameIndex(0);
        setSweepingPos(null);
      }
    }, 75);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        setIsDraggingBroom(true);
        setBroomFrameIndex(0);
        const { pageX, pageY } = evt.nativeEvent;
        pan.setValue({ x: pageX - 140, y: pageY - 100 });
      },

      onPanResponderMove: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        pan.setValue({ x: pageX - 140, y: pageY - 100 });
      },

      onPanResponderRelease: (evt) => {
        setIsDraggingBroom(false);

        const dropX = evt.nativeEvent.pageX;
        const dropY = evt.nativeEvent.pageY;
        const radius = 80;

        const cleanedPoop = poopsRef.current.find((poop) => {
          const dist = Math.hypot(poop.x + 20 - dropX, poop.y + 20 - dropY);
          return dist < radius;
        });

        if (cleanedPoop) {
          triggerBroomAnimation(cleanedPoop);
        }
      },
    })
  ).current;

  const meatPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => meatCountRef.current > 0,
      onMoveShouldSetPanResponder: () => meatCountRef.current > 0,

      onPanResponderGrant: (evt) => {
        if (meatCountRef.current <= 0) return;
        setIsDraggingMeat(true);
        const { pageX, pageY } = evt.nativeEvent;
        meatPanPosition.setValue({ x: pageX - 30, y: pageY - 30 });
      },

      onPanResponderMove: (evt) => {
        if (meatCountRef.current <= 0) return;
        const { pageX, pageY } = evt.nativeEvent;
        meatPanPosition.setValue({ x: pageX - 30, y: pageY - 30 });
      },

      onPanResponderRelease: (evt) => {
        setIsDraggingMeat(false);

        const dropX = evt.nativeEvent.pageX;
        const dropY = evt.nativeEvent.pageY;

        const petX = posRef.current.x;
        const petY = posRef.current.y;

        const radius = 90;
        const dist = Math.hypot(petX + 90 - dropX, petY + 100 - dropY);

        if (dist < radius && meatCountRef.current > 0) {
          const currentHunger = petHungerRef.current;

          if (currentHunger >= 100) {
            setPetActionState('REFUSE');
            setFrameIndex(0);
          } else {
            const updatedMeat = Math.max(0, meatCount - 1);
            setMeatCount(updatedMeat);

            setPetActionState('EAT');
            setFrameIndex(0);

            const newHunger = Math.min(100, currentHunger + 25);
            starvationStartTimeRef.current = null;

            setCurrentPet((prev) => {
              const expGained = 10;
              const expNeeded = 100;

              let newExp = prev.friendshipExp + expGained;
              let newLevel = prev.friendshipLevel;

              if (newExp >= expNeeded) {
                newLevel += 1;
                newExp = newExp % expNeeded;
              }

              const updatedPet = {
                ...prev,
                hunger: newHunger,
                friendshipExp: newExp,
                friendshipLevel: newLevel,
              };

              saveAllGameData(updatedPet, undefined, updatedMeat, undefined, null);

              return updatedPet;
            });
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    const MAP_SPRITES = [
      ...currentPetSprites,
      ...currentClickSprites,
      ...currentCryingSprites,
      ...currentEatingSprites,
      ...currentRefuseSprites,
      ...POOP_SPRITES,
      ...BROOM_SPRITES,
      BROOM_ICON_ASSET,
      MEAT_ICON_ASSET,
      MAP_ASSETS.background,
      MAP_ASSETS.tree,
    ];

    MAP_SPRITES.forEach((sprite) => {
      const asset = Asset.fromModule(sprite);
      if (asset.uri) {
        Image.prefetch(asset.uri);
      }
    });
  }, [selectedPet]);

  useEffect(() => {
    if (petActionState === 'REFUSE') {
      let currentStep = 0;
      const refuseInterval = setInterval(() => {
        currentStep++;
        if (currentStep >= currentRefuseSprites.length) {
          clearInterval(refuseInterval);
          setPetActionState(petHungerRef.current <= 0 ? 'CRYING' : 'IDLE');
          setFrameIndex(0);
        } else {
          setFrameIndex(currentStep);
        }
      }, 130);

      return () => clearInterval(refuseInterval);
    }

    if (petActionState === 'EAT') {
      let currentStep = 0;
      const eatInterval = setInterval(() => {
        currentStep++;
        if (currentStep >= currentEatingSprites.length) {
          clearInterval(eatInterval);
          setPetActionState(petHungerRef.current <= 0 ? 'CRYING' : 'IDLE');
          setFrameIndex(0);
        } else {
          setFrameIndex(currentStep);
        }
      }, 120);

      return () => clearInterval(eatInterval);
    }

    if (petActionState === 'CRYING') {
      let cryStep = 0;
      const totalFrames = currentCryingSprites.length;
      const maxSteps = totalFrames * 2;

      const cryInterval = setInterval(() => {
        cryStep++;
        if (cryStep >= maxSteps) {
          clearInterval(cryInterval);
          clickCountRef.current = 0;
          setPetActionState(petHungerRef.current <= 0 ? 'CRYING' : 'IDLE');
          setFrameIndex(0);
        } else {
          setFrameIndex(cryStep % totalFrames);
        }
      }, CRYING_ANIM_SPEED);

      return () => clearInterval(cryInterval);
    }

    if (petActionState === 'CLICKING') {
      let currentStep = 0;
      const clickInterval = setInterval(() => {
        currentStep++;
        if (currentStep >= currentClickSprites.length) {
          clearInterval(clickInterval);
          setPetActionState(petHungerRef.current <= 0 ? 'CRYING' : 'IDLE');
          setFrameIndex(0);
        } else {
          setFrameIndex(currentStep);
        }
      }, ACTION_ANIM_SPEED);

      return () => clearInterval(clickInterval);
    }

    const totalWalkFrames = currentPetSprites.length;

    const generateSequence = () => {
      if (selectedPet === 'olho' && totalWalkFrames >= 8) {
        const bodySequence = [0, 1, 2, 3, 4];
        const now = Date.now();

        if (
          currentSpecialSprites.length > 0 &&
          now - lastSpecialTimeRef.current >= SPECIAL_ANIM_INTERVAL
        ) {
          lastSpecialTimeRef.current = now;
          return {
            type: 'WITH_SPECIAL',
            sequence: [],
            specialFrames: Array.from({ length: currentSpecialSprites.length }, (_, i) => i),
          };
        }

        const repeatOptions = [2, 3, 4, 5, 6]; 
        const randomRepeats = repeatOptions[Math.floor(Math.random() * repeatOptions.length)];
        
        const walkVariableSeconds = Array(randomRepeats).fill(bodySequence).flat();

        return {
          type: 'STANDARD',
          sequence: [...walkVariableSeconds, 5, 6, 7],
        };
      }

      const bodySequence = Array.from({ length: totalWalkFrames }, (_, i) => i);

      if (currentSpecialSprites.length > 0 && Math.random() < 0.15) {
        return {
          type: 'WITH_SPECIAL',
          sequence: [],
          specialFrames: Array.from({ length: currentSpecialSprites.length }, (_, i) => i),
        };
      }

      const repeatOptions = [6, 8, 10];
      const randomRepeats = repeatOptions[Math.floor(Math.random() * repeatOptions.length)];
      return {
        type: 'STANDARD',
        sequence: Array(randomRepeats).fill(bodySequence).flat(),
      };
    };

    let currentConfig = generateSequence();
    let step = 0;
    let isPlayingSpecial = currentConfig.type === 'WITH_SPECIAL';
    let specialStep = 0;
    let animTimeout: ReturnType<typeof setTimeout>;

    const runAnimationFrame = () => {
      if (isStaticIdleRef.current && selectedPet !== 'olho') {
        setFrameIndex(1);
        animTimeout = setTimeout(runAnimationFrame, WALK_ANIM_SPEED);
        return;
      }

      if (isPlayingSpecial && currentConfig.specialFrames && currentConfig.specialFrames.length > 0) {
        setFrameIndex(100 + currentConfig.specialFrames[specialStep]);
        specialStep++;

        if (specialStep >= currentConfig.specialFrames.length) {
          isPlayingSpecial = false;
          specialStep = 0;
          step = 0;
          currentConfig = generateSequence();
        }
        animTimeout = setTimeout(runAnimationFrame, WALK_ANIM_SPEED);
        return;
      }

      const nextFrame = currentConfig.sequence[step];
      setFrameIndex(nextFrame);
      step++;

      if (step >= currentConfig.sequence.length) {
        step = 0;
        currentConfig = generateSequence();
        if (currentConfig.type === 'WITH_SPECIAL') {
          isPlayingSpecial = true;
          specialStep = 0;
        }
      }

      const isBlinkFrame = selectedPet === 'olho' && (nextFrame === 5 || nextFrame === 6 || nextFrame === 7);
      const currentSpeed = isBlinkFrame ? BLINK_ANIM_SPEED : WALK_ANIM_SPEED;

      animTimeout = setTimeout(runAnimationFrame, currentSpeed);
    };

    runAnimationFrame();

    return () => clearTimeout(animTimeout);
  }, [
    currentPetSprites,
    currentClickSprites,
    currentCryingSprites,
    currentSpecialSprites,
    currentEatingSprites,
    currentRefuseSprites,
    petActionState,
    selectedPet,
  ]);

  const getActiveSprite = () => {
    if (petActionState === 'REFUSE' && currentRefuseSprites.length > 0) {
      return currentRefuseSprites[frameIndex % currentRefuseSprites.length];
    }
    if (petActionState === 'EAT' && currentEatingSprites.length > 0) {
      return currentEatingSprites[frameIndex % currentEatingSprites.length];
    }
    if (petActionState === 'CRYING') {
      return currentCryingSprites[frameIndex % currentCryingSprites.length];
    }
    if (petActionState === 'CLICKING') {
      return currentClickSprites[frameIndex % currentClickSprites.length];
    }

    if (frameIndex >= 100) {
      const specialIndex = frameIndex - 100;
      const validSpecialLength = currentSpecialSprites.length > 0 ? currentSpecialSprites.length : 1;
      return currentSpecialSprites[specialIndex % validSpecialLength];
    }

    return currentPetSprites[frameIndex % currentPetSprites.length];
  };

  const handlePetPress = () => {
    if (petHungerRef.current <= 0) return;

    clickCountRef.current += 1;

    if (resetClickTimerRef.current) clearTimeout(resetClickTimerRef.current);
    resetClickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1200);

    if (clickCountRef.current >= 5) {
      setPetActionState('CRYING');
      setFrameIndex(0);
      return;
    }

    if (petActionState === 'CRYING' || petActionState === 'EAT' || petActionState === 'REFUSE') return;

    setPetActionState('CLICKING');
    setFrameIndex(0);
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let isMoving = false;
    let moveX = 0;
    let moveY = 0;
    let timerId: ReturnType<typeof setTimeout>;

    const getRandomTime = (minSec: number, maxSec: number) => {
      return Math.floor(Math.random() * (maxSec - minSec + 1) + minSec) * 1000;
    };

    const decideNextState = () => {
      if (petActionState !== 'IDLE') {
        timerId = setTimeout(decideNextState, 1000);
        return;
      }

      isMoving = !isMoving;

      if (isMoving) {
        setIsStaticIdle(false);
        moveX = Math.floor(Math.random() * 3) - 1;
        moveY = Math.floor(Math.random() * 3) - 1;

        if (moveX === 0 && moveY === 0) {
          moveX = Math.random() > 0.5 ? 1 : -1;
        }

        if (moveX > 0) setDirX('right');
        if (moveX < 0) setDirX('left');

        const walkDuration = getRandomTime(2, 4);
        timerId = setTimeout(decideNextState, walkDuration);
      } else {
        moveX = 0;
        moveY = 0;

        const shouldBeStatic = selectedPet === 'olho' ? false : Math.random() > 0.5;
        setIsStaticIdle(shouldBeStatic);

        let idleDuration = shouldBeStatic ? getRandomTime(3, 6) : getRandomTime(8, 12);
        timerId = setTimeout(decideNextState, idleDuration);
      }
    };

    decideNextState();

    const walkInterval = setInterval(() => {
      if (!isMoving || petActionState !== 'IDLE' || petHungerRef.current <= 0) return;

      const minX = 20;
      const maxX = SCREEN_WIDTH - 150;
      const minY = 120;
      const maxY = SCREEN_HEIGHT * 0.42;

      const treeHitbox = { x: -20, y: 0, width: 180, height: 180 };

      const checkCollision = (nextX: number, nextY: number) => {
        const petHitbox = { x: nextX, y: nextY, width: 150, height: 150 };
        return (
          petHitbox.x < treeHitbox.x + treeHitbox.width &&
          petHitbox.x + petHitbox.width > treeHitbox.x &&
          petHitbox.y < treeHitbox.y + treeHitbox.height &&
          petHitbox.y + petHitbox.height > treeHitbox.y
        );
      };

      let currentX = posRef.current.x;
      let currentY = posRef.current.y;

      let nextX = currentX + moveX * 2;
      let nextY = currentY + moveY * 1.5;

      if (nextX <= minX || nextX >= maxX || checkCollision(nextX, currentY)) {
        moveX = -moveX;
        if (moveX > 0) setDirX('right');
        if (moveX < 0) setDirX('left');
        nextX = Math.max(minX, Math.min(maxX, currentX));
      }

      if (nextY <= minY || nextY >= maxY || checkCollision(currentX, nextY)) {
        moveY = -moveY;
        nextY = Math.max(minY, Math.min(maxY, currentY));
      }

      posRef.current = { x: nextX, y: nextY };
      setPosX(nextX);
      setPosY(nextY);
    }, 60);

    return () => {
      clearTimeout(timerId);
      clearInterval(walkInterval);
    };
  }, [gameState, petActionState]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const coinInterval = setInterval(() => {
      setCoins((prev) => {
        const updatedCoins = prev + 1;
        saveAllGameData(undefined, updatedCoins);
        return updatedCoins;
      });
    }, 3600000);

    return () => clearInterval(coinInterval);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const poopInterval = setInterval(() => {
      const newPoop = generateRandomPoopPosition();

      setPoops((prev) => {
        const updatedPoops = [...prev, newPoop];
        saveAllGameData(undefined, undefined, undefined, updatedPoops);
        return updatedPoops;
      });
    }, MS_PER_POOP);

    return () => clearInterval(poopInterval);
  }, [gameState]);

  const handleConfirmName = () => {
    const trimmedName = petName.trim();

    if (trimmedName.length > 0) {
      const newPet = { ...currentPet, name: trimmedName, type: selectedPet };
      setCurrentPet(newPet);
      setGameState('PLAYING');

      saveAllGameData(newPet);
    }
  };

  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.loadingSafeArea}>
        <ActivityIndicator size="large" color="#FFD166" />
      </SafeAreaView>
    );
  }

  if (gameState === 'GAME_OVER') {
    return (
      <SafeAreaView style={styles.gameOverSafeArea}>
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}> Seu Pet Morreu...</Text>
          <Text style={styles.gameOverSubtitle}>
            Ele ficou muito tempo sem comer e não resistiu.
          </Text>

          <TouchableOpacity
            style={styles.restartButton}
            onPress={handleRestartGame}
          >
            <Text style={styles.restartButtonText}>Recomeçar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (gameState === 'NAME_PET') {
    return (
      <SafeAreaView style={styles.namingSafeArea}>
        <View style={styles.namingContainer}>
          <Text style={styles.namingTitle}>Seu pet nasceu!</Text>
          <Text style={styles.namingSubtitle}>Escolha um nome para ele:</Text>

          <Image
            source={currentPetSprites[frameIndex % currentPetSprites.length]}
            style={styles.previewPetImage}
          />

          <TextInput
            style={styles.nameInput}
            placeholder="Digite o nome..."
            placeholderTextColor="#888"
            value={petName}
            onChangeText={setPetName}
            maxLength={12}
          />

          <TouchableOpacity
            style={[
              styles.confirmButton,
              petName.trim().length === 0 && styles.disabledConfirmButton,
            ]}
            onPress={handleConfirmName}
            disabled={petName.trim().length === 0}
          >
            <Text style={styles.confirmButtonText}>Começar Aventura</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.gameZone}>
          <Image source={MAP_ASSETS.background} style={styles.mapBackground} />
          <Image source={MAP_ASSETS.tree} style={styles.tree} />

          {poops.map((poop) => (
            <Image
              key={poop.id}
              source={POOP_SPRITES[poopFrameIndex]}
              style={[
                styles.poopSprite,
                {
                  left: poop.x,
                  top: poop.y,
                  zIndex: Math.floor(poop.y / 10),
                },
              ]}
            />
          ))}

          {isSweeping && sweepingPos && (
            <Image
              source={BROOM_SPRITES[broomFrameIndex]}
              style={[
                styles.sweepingBroomSprite,
                {
                  left: sweepingPos.x,
                  top: sweepingPos.y,
                  zIndex: Math.floor(sweepingPos.y + 200),
                },
              ]}
            />
          )}

          <TouchableOpacity
            activeOpacity={1}
            onPress={handlePetPress}
            style={[
              styles.petImage,
              {
                left: posX,
                top: posY,
                zIndex: Math.floor(posY + 100),
                transform: dirX === 'right' ? [{ scaleX: -1 }] : [],
              },
            ]}
          >
            <Image source={getActiveSprite()} style={styles.petImageSprite} />
          </TouchableOpacity>
        </View>

        <View style={styles.uiZone}>
          <View style={styles.hudHeader}>
            <View style={styles.coinBadge}>
              <Text style={styles.coinText}>🪙 {coins}</Text>
            </View>

            <TouchableOpacity style={styles.shopButton} onPress={() => setIsShopOpen(true)}>
              <Text style={styles.shopButtonText}>🛒 Loja</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.petNameButton} onPress={() => setIsModalOpen(true)}>
              <Text style={styles.petNameHeader}>📊 Perfil</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsBar}>
            <View
              {...meatPanResponder.panHandlers}
              style={[
                styles.actionButton,
                meatCount === 0 && styles.disabledButton,
              ]}
            >
              <Image
                source={MEAT_ICON_ASSET}
                style={[
                  styles.actionItemIcon,
                  { opacity: isDraggingMeat ? 0 : 1 },
                ]}
              />
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{meatCount}</Text>
              </View>
            </View>

            <View
              {...panResponder.panHandlers}
              style={[styles.actionButton, { overflow: 'hidden' }]}
            >
              <Image
                source={BROOM_ICON_ASSET}
                style={[
                  styles.menuBroomIcon,
                  { opacity: isDraggingBroom ? 0 : 1 },
                ]}
              />
            </View>

            <TouchableOpacity style={[styles.actionButton, styles.disabledButton]}>
              <Text style={styles.buttonIcon}>🎮</Text>
            </TouchableOpacity>
          </View>
        </View>

        <PetStatusModal
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pets={islandPets}
        />

        <ShopModal
          visible={isShopOpen}
          onClose={() => setIsShopOpen(false)}
          coins={coins}
          onBuyMeat={(cost) => {
            const updatedCoins = coins - cost;
            const updatedMeat = meatCount + 1;

            setCoins(updatedCoins);
            setMeatCount(updatedMeat);

            saveAllGameData(undefined, updatedCoins, updatedMeat);
          }}
        />

        {isDraggingBroom && (
          <Animated.View
            style={[
              styles.floatingBroom,
              {
                left: pan.x,
                top: pan.y,
              },
            ]}
            pointerEvents="none"
          >
            <Image source={BROOM_ICON_ASSET} style={styles.broomDragSprite} />
          </Animated.View>
        )}

        {isDraggingMeat && (
          <Animated.View
            style={[
              styles.floatingMeat,
              {
                left: meatPanPosition.x,
                top: meatPanPosition.y,
              },
            ]}
            pointerEvents="none"
          >
            <Image source={MEAT_ICON_ASSET} style={styles.meatDragSprite} />
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#50b8d6',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#50b8d6',
  },
  loadingSafeArea: {
    flex: 1,
    backgroundColor: '#1e1e24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverSafeArea: {
    flex: 1,
    backgroundColor: '#18181C',
  },
  gameOverContainer: {
    flex: 1,
    backgroundColor: '#18181C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  gameOverTitle: {
    color: '#FF5964',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  gameOverSubtitle: {
    color: '#AAA',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    margin: 15,
  },
  restartButton: {
    backgroundColor: '#FF5964',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    margin: 10,
  },
  restartButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  petNameButton: {
    backgroundColor: '#2A2A35',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a96ac',
  },
  petNameHeader: {
    color: '#FFD166',
    fontSize: 15,
    fontWeight: 'bold',
  },
  namingSafeArea: {
    flex: 1,
    backgroundColor: '#1E1E24',
  },
  namingContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  namingTitle: {
    marginTop: -50,
    color: '#FFD166',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  namingSubtitle: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 20,
  },
  previewPetImage: {
    width: 240,
    height: 240,
    resizeMode: 'contain',
    marginVertical: 5,
    marginLeft: 20,
    alignSelf: 'center',
    // @ts-ignore
    imageRendering: 'pixelated',
  },
  nameInput: {
    backgroundColor: '#2A2A35',
    color: '#FFF',
    width: '80%',
    height: 50,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFD166',
    paddingHorizontal: 16,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  confirmButton: {
    marginTop: 10,
    backgroundColor: '#FFD166',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  disabledConfirmButton: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#1E1E24',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameZone: {
    flex: 1,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mapBackground: {
    width: '112%',
    height: '110%',
    resizeMode: 'contain',
    marginTop: -87,
    // @ts-ignore
    imageRendering: 'pixelated',
  },
  tree: {
    position: 'absolute',
    top: '2%',
    left: '5%',
    width: 180,
    height: 180,
    resizeMode: 'contain',
    zIndex: 1,
    // @ts-ignore
    imageRendering: 'pixelated',
  },
  petImage: {
    position: 'absolute',
    width: 190,
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  petImageSprite: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    // @ts-ignore
    imageRendering: 'pixelated',
  },
  poopSprite: {
    position: 'absolute',
    width: 45,
    height: 45,
    resizeMode: 'contain',
    // @ts-ignore
    imageRendering: 'pixelated',
  },
  sweepingBroomSprite: {
    position: 'absolute',
    width: 100,
    height: 100,
    resizeMode: 'contain',
    // @ts-ignore
    imageRendering: 'pixelated',
  },
  floatingBroom: {
    position: 'absolute',
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    transform: [{ rotate: '45deg' }],
  },
  broomDragSprite: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    // @ts-ignore
    imageRendering: 'pixelated',
  },
  menuBroomIcon: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    transform: [{ rotate: '45deg' }],
    marginBottom: 2,
    // @ts-ignore
    imageRendering: 'pixelated',
  },
  uiZone: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '24%',
    backgroundColor: 'rgba(30, 30, 36, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingTop: 25,
    justifyContent: 'flex-start',
    gap: 25,
    zIndex: 20,
    overflow: 'hidden',
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinBadge: {
    backgroundColor: '#2A2A35',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD166',
  },
  coinText: {
    color: '#FFD166',
    fontWeight: 'bold',
    fontSize: 16,
  },
  shopButton: {
    height: 38,
    backgroundColor: '#2A2A35',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD166',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopButtonText: {
    color: '#FFD166',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: '#2A2A35',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 80,
    position: 'relative',
  },
  actionItemIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    // @ts-ignore
    imageRendering: 'pixelated',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonIcon: {
    fontSize: 24,
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5964',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  countText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  floatingMeat: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  meatDragSprite: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    // @ts-ignore
    imageRendering: 'pixelated',
  },
});