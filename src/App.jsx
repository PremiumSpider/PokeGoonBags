// App.jsx - Part 1
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [orientation, setOrientation] = useState(window.screen.orientation?.type || 'portrait')
  const [bagCount, setBagCount] = useState(null)
  const [chaseCount, setChaseCount] = useState(null)
  const [remainingChases, setRemainingChases] = useState(null)
  const [numbers, setNumbers] = useState([])
  const [selectedNumbers, setSelectedNumbers] = useState(new Set())
  const [chaseNumbers, setChaseNumbers] = useState(new Set())
  const [isCooked, setIsCooked] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showTopChases, setShowTopChases] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [prizeImage, setPrizeImage] = useState(null)
  const [marks, setMarks] = useState([])
  const [markSize, setMarkSize] = useState(4)
  const [controlsVisible, setControlsVisible] = useState(true)
  const controlsTimeout = useRef(null)
  const imageContainerRef = useRef(null)
  
  const [zoomState, setZoomState] = useState(() => {
    const saved = localStorage.getItem('gachaBagZoomState')
    return saved ? JSON.parse(saved) : {
      scale: 1,
      positionX: 0,
      positionY: 0
    }
  })

    useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.screen.orientation?.type || 
        (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'))
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleOrientationChange)
    }
  }, [])

  useEffect(() => {
    if (showTopChases) {
      const hideControls = () => setControlsVisible(false)
      controlsTimeout.current = setTimeout(hideControls, 2000)

      const handleInteraction = () => {
        setControlsVisible(true)
        clearTimeout(controlsTimeout.current)
        controlsTimeout.current = setTimeout(hideControls, 2000)
      }

      window.addEventListener('touchstart', handleInteraction)
      window.addEventListener('mousemove', handleInteraction)

      return () => {
        clearTimeout(controlsTimeout.current)
        window.removeEventListener('touchstart', handleInteraction)
        window.removeEventListener('mousemove', handleInteraction)
      }
    }
  }, [showTopChases])

  useEffect(() => {
    try {
      const savedState = localStorage.getItem('gachaBagState')
      const savedImage = localStorage.getItem('gachaBagImage')
      
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        setBagCount(parsedState.bagCount)
        setChaseCount(parsedState.chaseCount)
        setRemainingChases(parsedState.remainingChases)
        setNumbers(Array.from({ length: parsedState.bagCount }, (_, i) => i + 1))
        setSelectedNumbers(new Set(parsedState.selectedNumbers))
        setChaseNumbers(new Set(parsedState.chaseNumbers))
        setMarks(parsedState.marks || [])
        setMarkSize(parsedState.markSize || 4)
      } else {
        setBagCount(50)
        setChaseCount(8)
        setRemainingChases(8)
        setNumbers(Array.from({ length: 50 }, (_, i) => i + 1))
      }

      if (savedImage) {
        setPrizeImage(savedImage)
      }
    } catch (error) {
      setBagCount(50)
      setChaseCount(8)
      setRemainingChases(8)
      setNumbers(Array.from({ length: 50 }, (_, i) => i + 1))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoading) return;

    try {
      const stateToSave = {
        bagCount,
        chaseCount,
        selectedNumbers: Array.from(selectedNumbers),
        chaseNumbers: Array.from(chaseNumbers),
        remainingChases,
        marks,
        markSize
      }
      localStorage.setItem('gachaBagState', JSON.stringify(stateToSave))
    } catch (error) {
      console.error('Error saving state:', error)
    }
  }, [bagCount, chaseCount, selectedNumbers, chaseNumbers, remainingChases, marks, markSize, isLoading])

  useEffect(() => {
    setIsCooked(remainingChases === 0 && selectedNumbers.size < bagCount)
  }, [remainingChases, selectedNumbers.size, bagCount])

    const handleReset = () => {
    try {
      localStorage.removeItem('gachaBagState')
      localStorage.removeItem('gachaBagImage')
      localStorage.removeItem('gachaBagZoomState')
      setBagCount(50)
      setChaseCount(8)
      setRemainingChases(8)
      setSelectedNumbers(new Set())
      setChaseNumbers(new Set())
      setNumbers(Array.from({ length: 50 }, (_, i) => i + 1))
      setIsCooked(false)
      setPrizeImage(null)
      setMarks([])
      setMarkSize(4)
      setZoomState({ scale: 1, positionX: 0, positionY: 0 })
      setShowResetConfirm(false)
    } catch (error) {
      console.error('Error resetting state:', error)
    }
  }

  const handleBagCountChange = (increment) => {
    const newCount = Math.max(1, Math.min(100, bagCount + increment))
    setBagCount(newCount)
    setNumbers(Array.from({ length: newCount }, (_, i) => i + 1))
    setIsCooked(false)
  }

  const handleChaseCountChange = (increment) => {
    const newCount = Math.max(0, Math.min(100, chaseCount + increment))
    setChaseCount(newCount)
    setRemainingChases(newCount)
    setChaseNumbers(new Set())
    setIsCooked(false)
  }

  const handleMarkSizeChange = (increment) => {
    const newSize = Math.max(1, Math.min(15, markSize + increment))
    setMarkSize(newSize)
  }

  const toggleNumber = (number) => {
    const newSelected = new Set(selectedNumbers)
    const newChases = new Set(chaseNumbers)

    if (!newSelected.has(number)) {
      newSelected.add(number)
    } else if (!newChases.has(number)) {
      newChases.add(number)
      setRemainingChases(prev => prev - 1)
    } else {
      newSelected.delete(number)
      newChases.delete(number)
      setRemainingChases(prev => prev + 1)
    }

    setSelectedNumbers(newSelected)
    setChaseNumbers(newChases)
  }

  const calculateHitRatio = () => {
    const remainingBags = bagCount - selectedNumbers.size
    if (remainingBags === 0) return '0%'
    const ratio = (remainingChases / remainingBags) * 100
    return `${ratio.toFixed(1)}%`
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target.result
        setPrizeImage(imageData)
        localStorage.setItem('gachaBagImage', imageData)
        setMarks([])
      }
      reader.readAsDataURL(file)
    }
  }

const handleImageClick = (e) => {
  if (!imageContainerRef.current) return;
  
  const rect = imageContainerRef.current.getBoundingClientRect();
  const image = imageContainerRef.current.querySelector('img');
  if (!image) return;
  
  const imageRect = image.getBoundingClientRect();
  
  // Get click position relative to the image
  const x = (e.clientX - imageRect.left);
  const y = (e.clientY - imageRect.top);
  
  // Convert to percentage of image dimensions
  const xPercent = (x / imageRect.width) * 100;
  const yPercent = (y / imageRect.height) * 100;
  
  // Calculate the size of the X mark in pixels (1rem = 16px)
  const markSizeInPixels = markSize * 16;
  
  // Calculate offsets as percentages of image dimensions
  const offsetX = (markSizeInPixels / imageRect.width) * 50; // 50% of mark size
  const offsetY = (markSizeInPixels / imageRect.height) * 50; // 50% of mark size
  
  setMarks([...marks, { 
    x: xPercent - offsetX, 
    y: yPercent - offsetY 
  }]);
};

  const handleUndo = () => {
    setMarks(marks.slice(0, -1))
  }

  const gridCols = orientation.includes('landscape') 
    ? 'grid-cols-10'
    : 'grid-cols-5'

  if (isLoading) {
    return <div>Loading...</div>
  }

    return (
<div className="h-screen bg-gradient-to-br from-blue-600 via-teal-500 to-green-400 p-4">
      <div className="h-full bg-white/10 backdrop-blur-md rounded-2xl shadow-xl">
        {!showTopChases ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4">
              <button
                onClick={() => setShowTopChases(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Top Chases
              </button>

              <img 
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/9.gif"
                alt="Blastoise"
                className="w-20 h-20 object-contain"
              />
              <img 
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/245.gif"
                alt="Suicune"
                className="w-26 h-26 object-contain"
              />
              <img 
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/9.gif"
                alt="Blastoise"
                className="w-20 h-20 object-contain"
              />              
              
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-6 py-3 rounded-xl shadow-lg transition-all transform hover:scale-105 ${
                  isEditMode 
                    ? 'bg-gradient-to-r from-teal-500 to-green-600 text-white'
                    : 'bg-gradient-to-r from-gray-200 to-gray-300'
                }`}
              >
                {isEditMode ? 'Done Editing' : 'Edit Mode'}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 mb-2">
              <img 
                src="/pokegoons-logo.png" 
                alt="PokeGoons Logo" 
                className="w-20 h-20 object-contain animate-pulse"
                style={{ animationDuration: '3s' }}
              />
              <h1 className="text-4xl font-black text-transparent bg-clip-text relative">
                <span className="absolute inset-0 text-4xl font-black text-white blur-sm">
                  POKEGOONS BAGS
                </span>
                <span className="relative animate-gradient-x bg-gradient-to-r from-blue-400 via-teal-500 to-green-600 bg-clip-text text-transparent">
                  POKEGOONS BAGS
                </span>
              </h1>
              <img 
                src="/pokegoons-logo.png" 
                alt="PokeGoons Logo" 
                className="w-20 h-20 object-contain animate-pulse"
                style={{ animationDuration: '3s' }}
              />
            </div>

            <AnimatePresence mode="wait">
              {isEditMode && (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-wrap items-center justify-between gap-4 mx-4 mb-2 bg-black/20 backdrop-blur-sm p-4 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-white">Total Bags:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBagCountChange(-1)}
                          className="w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-lg text-xl"
                        >
                          -
                        </button>
                        <span className="text-xl font-bold text-white w-10 text-center">
                          {bagCount}
                        </span>
                        <button
                          onClick={() => handleBagCountChange(1)}
                          className="w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-lg text-xl"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-white">Total Chases:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleChaseCountChange(-1)}
                          className="w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-lg text-xl"
                        >
                          -
                        </button>
                        <span className="text-xl font-bold text-white w-10 text-center">
                          {chaseCount}
                        </span>
                        <button
                          onClick={() => handleChaseCountChange(1)}
                          className="w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-lg text-xl"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-colors text-base font-medium"
                    >
                      Reset
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isCooked && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="mx-4 mb-2 p-3 bg-gradient-to-r from-teal-400 to-blue-500 rounded-xl text-white text-center font-bold text-xl shadow-lg"
                >
                  🌊 COOKED! 🌊
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className={`grid ${gridCols} gap-2 mx-4 flex-1 h-[calc(100vh-280px)]`}>
              {numbers.map((number) => (
                <motion.div
                  key={number}
                  onClick={() => toggleNumber(number)}
                  className={`
                    relative flex items-center justify-center 
                    rounded-xl cursor-pointer text-xl font-bold shadow-lg
                    ${
                      chaseNumbers.has(number)
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-white'
                        : selectedNumbers.has(number)
                        ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white'
                        : 'bg-gradient-to-r from-blue-700 to-blue-900 text-white hover:from-blue-600 hover:to-blue-800'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {number}
                  {(selectedNumbers.has(number)) && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-full h-0.5 bg-white transform rotate-45" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 mx-4 mt-2 text-lg font-bold">
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/80 to-cyan-600/80 text-white">
                Bags Left: {bagCount - selectedNumbers.size} / {bagCount}
              </div>
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-white">
                Remaining Chases: {remainingChases}
              </div>
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/80 to-blue-600/80 text-white">
                Hit Ratio: {calculateHitRatio()}
              </div>
            </div>

            <AnimatePresence>
              {showResetConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowResetConfirm(false)
                    }
                  }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 10 }}
                    className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
                  >
                    <motion.div
                      initial={{ y: -20 }}
                      animate={{ y: 0 }}
                      className="text-center mb-6"
                    >
                      <motion.div
                        animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-4xl mb-4"
                      >
                        🌊
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-2 text-blue-500">Woah there!</h3>
                      <p className="text-gray-600">
                        Are you sure you want to reset everything? 
                        <br/>
                        <span className="text-sm">This action cannot be undone! 😱</span>
                      </p>
                    </motion.div>
                    
                    <div className="flex gap-3 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-gray-200 rounded-lg text-gray-800 font-medium hover:bg-gray-300 transition-colors"
                        onClick={() => setShowResetConfirm(false)}
                      >
                        Nevermind 😅
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-teal-600 rounded-lg text-white font-medium hover:shadow-lg transition-all"
                        onClick={handleReset}
                      >
                        Yes, Reset! 💧
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          // Top Chases view remains mostly the same, just updating some colors
          <div className="relative h-[100dvh] max-h-[100dvh] w-full overflow-hidden">
            <div className="absolute top-safe-4 left-4 z-[60]">
              <button
                onClick={() => setShowTopChases(false)}
                className="px-6 py-3 bg-blue-900/40 hover:bg-blue-800/50 text-white rounded-lg transition-colors text-lg md:text-xl"
              >
                Show Bags
              </button>
            </div>

            <AnimatePresence>
              {controlsVisible && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-safe-4 left-[180px] z-50 flex flex-wrap gap-4"
                >
                  {marks.length > 0 && (
                    <button
                      onClick={handleUndo}
                      className="px-6 py-3 bg-blue-900/40 hover:bg-blue-800/50 text-white rounded-lg transition-colors text-lg md:text-xl"
                    >
                      Undo Mark
                    </button>
                  )}

                  <div className="flex items-center gap-3 bg-blue-900/40 p-3 rounded-lg">
                    <span className="text-white text-lg md:text-xl">Mark Size:</span>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      value={markSize}
                      onChange={(e) => setMarkSize(Number(e.target.value))}
                      className="w-32 h-2 bg-blue-800/30 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-white w-8 text-center text-lg md:text-xl">{markSize}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-full w-full">
              {prizeImage ? (
                <TransformWrapper
                  initialScale={zoomState.scale}
                  initialPositionX={zoomState.positionX}
                  initialPositionY={zoomState.positionY}
                  onTransformed={(e) => {
                    const newZoomState = {
                      scale: e.state.scale,
                      positionX: e.state.positionX,
                      positionY: e.state.positionY
                    }
                    setZoomState(newZoomState)
                    localStorage.setItem('gachaBagZoomState', JSON.stringify(newZoomState))
                  }}
                  minScale={0.5}
                  maxScale={4}
                  doubleClick={{ mode: "reset" }}
                  wheel={{ step: 0.1 }}
                >
                  <TransformComponent
                    wrapperClass="!w-full !h-full"
                    contentClass="!w-full !h-full"
                  >
                    <div 
                      className="relative w-full h-full" 
                      onClick={handleImageClick}
                      ref={imageContainerRef}
                    >
                      <img
                        src={prizeImage}
                        alt="Top Chases"
                        className="w-full h-full object-contain"
                      />
                      {marks.map((mark, index) => (
                        <motion.div
                          key={index}
                          className="absolute text-blue-400 font-bold pointer-events-none"
                          style={{ 
                            left: `${mark.x}%`,
                            top: `${mark.y}%`,
                            fontSize: `${markSize}rem`,
                            filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))'
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          ✕
                        </motion.div>
                      ))}
                    </div>
                  </TransformComponent>
                </TransformWrapper>
              ) : (
                <div className="w-full h-full bg-blue-900/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white">
                  <label className="cursor-pointer hover:text-blue-200 transition-colors text-lg md:text-xl">
                    <span className="sr-only">Upload a top chases image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    Upload a top chases image
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

  )
}

export default App