import React, { useContext, useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { SRLCtx } from '../SRLContext'
import imagesLoaded from 'imagesLoaded'

// IsEqual from lodash to do a deep comparison of the objects
const isEqual = require('lodash/isEqual')
const isEmpty = require('lodash/isEmpty')

const SRLWrapper = ({
  options,
  callbacks,
  children,
  defaultOptions,
  defaultCallbacks
}) => {
  // Add a state to check if the event listener is set
  const [listenerIsSet, setListenerIsSet] = useState(false)

  const [imagesAreLoaded, setImagesAreLoaded] = useState(false)

  // Imports the context
  const context = useContext(SRLCtx)

  // Sets a new Ref which will be used to target the div with the images
  const imagesContainer = useRef(null)

  useEffect(() => {
    // Dispatch the Action to grab the options
    const grabSettings = (options, callbacks) => {
      // console.log('dispatched options')
      // We merge the settings that we receive from the user via the props with the original ones (defaultOptions and defaultCallbacks)
      // If the user hasn't provided any options/callbacks via props we make mergedSettings use just the default options/callbacks
      let mergedSettings = {}
      if (isEmpty(options) && isEmpty(callbacks)) {
        mergedSettings = {
          options: {
            ...defaultOptions
          },
          callbacks: {
            ...defaultCallbacks
          }
        }
      } else {
        mergedSettings = {
          options: {
            ...defaultOptions,
            ...options
          },
          callbacks: {
            ...defaultCallbacks,
            ...callbacks
          }
        }
      }
      if (!isEqual(mergedSettings.options, context.options)) {
        context.dispatch({
          type: 'GRAB_SETTINGS',
          mergedSettings
        })
      }
    }

    // Dispatch the Action the grab the elements
    const grabElements = (elements) => {
      if (!isEqual(elements, context.elements)) {
        // console.log('dispatched grab elements')
        context.dispatch({
          type: 'GRAB_ELEMENTS',
          elements
        })
      }
    }

    // Dispatch the Action to handle the clicked item
    const handleElement = (element) => {
      // We don't want to dispatch the action if the selected image is already selected
      if (!isEqual(element, context.selectedElement)) {
        // console.log('dispatched grab element (single)')
        context.dispatch({
          type: 'HANDLE_ELEMENT',
          element
        })
      }
    }

    // // Generate a canvas with a frame from the video
    // function capture(video) {
    //   const scaleFactor = 1
    //   var w = video.videoWidth * scaleFactor
    //   var h = video.videoHeight * scaleFactor
    //   var canvas = document.createElement('canvas')
    //   canvas.width = w
    //   canvas.height = h
    //   var ctx = canvas.getContext('2d')
    //   ctx.drawImage(video, 0, 0, w, h)
    //   return canvas
    // }

    // // Takes the dataUrl from the canvas
    // function generateScreen(element) {
    //   var video = element
    //   var canvas = capture(video)
    //   const dataUrl = canvas.toDataURL()
    //   return dataUrl
    // }

    // Loop through the elements or the links to add them to the context
    const handleElementsWithContext = (array, elementType) => {
      const elements = array.map((e, index) => {
        // If the images is loaded and not broken
        // Also checks if the image is a Base64 image
        // const isBase64Image = e.img.src.includes("base64")
        if (e.isLoaded) {
          e.img.id = `element${index}`
          // Check if it's an image
          const isImage = /\.(gif|jpg|jpeg|tiff|png|webp)$/i.test(
            e.img.currentSrc || e.img.src || e.img.href
          )
          // Creates an object for each element
          const element = {
            // Grabs the "src" attribute from the image/video.
            // If it's a link grabs the "href" attribute.
            source:
              elementType === 'IMG'
                ? e.img.currentSrc || e.img.src || e.img.href || null
                : e.img.parentElement.href || null,

            thumbnail: e.img.parentElement.href
              ? e.img.currentSrc || null
              : e.img.parentElement.href || e.img.currentSrc || null,
            // Grabs the "alt" attribute from the image or the "textContent" from the video.
            // If it's a link grabs the "alt" attribute from the children image.
            caption: e.img.alt || e.img.textContent || null,
            // Grabs the newly created "id" attribute from the image/video
            // If it's a link grabs the "id" attribute from the children image.
            id: e.img.id || null,
            // Grabs the "width" from the image/video
            // If it's a link we can't grab the width and we will need to calculate it after
            width: isImage
              ? e.img.naturalWidth || null
              : e.img.videoWidth || null,
            // Grabs the "height" from the image/video
            // If it's a link we can't grab the height and we will need to calculate it after.
            height: isImage
              ? e.img.naturalHeight || null
              : e.img.videoHeight || null
            // Generates a thumbnail image for the video otherwise set it to null
            // videoThumbnail: isImage ? null : generateScreen(e)
          }

          // Adds an event listener that will trigger the function to open the lightbox (passed using the Context)
          e.img.addEventListener('click', (e) => {
            // Prevent the image from opening
            e.preventDefault()
            // Run the function to handle the clicked item
            handleElement(element)
          })

          // Return the image for the map function
          return element
        }
      })
      setListenerIsSet(true)
      // Use filter to remove the undefined values
      grabElements(elements.filter((e) => e !== undefined))
    }

    // Check if the images are loaded using "imagesLoaded" by Desandro (LOVE)
    // When te images are loaded set the state to TRUE and run the function to handle the context
    function handleLoadedImages(array, elementsAreLinks) {
      imagesLoaded(array, function (instance) {
        // Checks if the element (the first one) is an image or a link. If it's a link, the user is using the gallery
        // And we need to grab the correct source of the image, not the thumbnail
        const elementType = instance.elements[0].nodeName
        if (instance.isComplete) {
          setImagesAreLoaded(true)
          if (imagesAreLoaded) {
            handleElementsWithContext(instance.images, elementType)
          }
        }
      })
    }

    // Grabs the options set by the user first
    grabSettings(options, callbacks)
    // Grabs images and videos (REMOVES videos for now)
    const collectedElements = imagesContainer.current.querySelectorAll('img')
    // Grabs data attributes (in links)
    const collectedDataAttributes = imagesContainer.current.querySelectorAll(
      "a[data-attribute='SRL']"
    )

    // Set "listenerIsSet" so that we know that the event listener is only set ONCE
    if (!listenerIsSet) {
      // Checks if the user is not using the "data-attribute"
      if (collectedDataAttributes.length === 0) {
        handleLoadedImages(collectedElements)
      } else if (collectedDataAttributes.length > 0) {
        handleLoadedImages(collectedDataAttributes)
        // Throws a warning if the number of links is not equal to the number of images
        if (collectedDataAttributes.length !== collectedElements.length) {
          console.warn(
            `HEY!. You have ${collectedDataAttributes.length} links and ${collectedElements.length} images. You likely forgot to add the data-attribute="SRL" to one of your link wrapping your image!`
          )
        }
      }
    }
  }, [
    context,
    options,
    defaultOptions,
    listenerIsSet,
    imagesAreLoaded,
    defaultCallbacks,
    callbacks
  ])

  return <div ref={imagesContainer}>{children}</div>
}

export default SRLWrapper

SRLWrapper.propTypes = {
  defaultOptions: PropTypes.shape({
    autoplaySpeed: PropTypes.number,
    buttonsIconPadding: PropTypes.string,
    buttonsBackgroundColor: PropTypes.string,
    buttonsIconColor: PropTypes.string,
    buttonsSize: PropTypes.string,
    captionColor: PropTypes.string,
    captionFontFamily: PropTypes.string,
    captionFontSize: PropTypes.string,
    captionFontStyle: PropTypes.string,
    captionFontWeight: PropTypes.string,
    enablePanzoom: PropTypes.bool,
    hideControlsAfter: PropTypes.number,
    overlayColor: PropTypes.string,
    showCaption: PropTypes.bool,
    showThumbnails: PropTypes.bool,
    slideTransitionSpeed: PropTypes.number,
    thumbnailsOpacity: PropTypes.number,
    transitionSpeed: PropTypes.number,
    transitionTimingFunction: PropTypes.string,
    onSlideChange: PropTypes.func
  }),
  defaultCallbacks: PropTypes.shape({
    onSlideChange: PropTypes.func,
    onLightboxClosed: PropTypes.func
  }),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired,
  options: PropTypes.object,
  callbacks: PropTypes.object
}

SRLWrapper.defaultProps = {
  defaultOptions: {
    autoplaySpeed: 3000,
    buttonsIconPadding: '0px',
    buttonsBackgroundColor: 'rgba(30,30,36,0.8)',
    buttonsIconColor: 'rgba(255, 255, 255, 0.8)',
    buttonsSize: '40px',
    captionColor: '#FFFFFF',
    captionFontFamily: 'inherit',
    captionFontSize: 'inherit',
    captionFontStyle: 'inherit',
    captionFontWeight: 'inherit',
    enablePanzoom: true,
    hideControlsAfter: 3000,
    overlayColor: 'rgba(0, 0, 0, 0.9)',
    showCaption: true,
    showThumbnails: true,
    slideTransitionSpeed: 600,
    thumbnailsOpacity: 0.4,
    transitionSpeed: 500,
    transitionTimingFunction: 'ease'
  },
  defaultCallbacks: {
    onCountSlides: () => {},
    onSlideChange: () => {},
    onLightboxClosed: () => {},
    onLightboxOpened: () => {}
  }
}
