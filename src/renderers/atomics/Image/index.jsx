import './style.scss'
import React from 'react'
import { ContentUtils } from 'braft-utils'
import Switch from 'components/common/Switch'
import { imageControlItems } from 'configs/controls'

export default class Image extends React.Component {

  state = {
    toolbarVisible: false,
    toolbarOffset: 0,
    linkEditorVisible: false,
    sizeEditorVisible: false,
    captionEditorVisible: false,
    tempLink: null,
    tempWidth: null,
    tempHeight: null,
    tempCaption: null
  }

  render () {

    const { mediaData, language, imageControls } = this.props
    const { toolbarVisible, toolbarOffset, linkEditorVisible, sizeEditorVisible, captionEditorVisible } = this.state
    const blockData = this.props.block.getData()

    let float = blockData.get('float')
    let alignment = blockData.get('alignment')
    let { url, link, link_target, width, height, meta, caption } = mediaData
    let imageStyles = {}
    let clearFix = false

    if (float) {
      alignment = null
    } else if (alignment === 'left') {
      imageStyles.float = 'left'
      clearFix = true
    } else if (alignment === 'right') {
      imageStyles.float = 'right'
      clearFix = true
    } else if (alignment === 'center') {
      imageStyles.textAlign = 'center'
    } else {
      imageStyles.float = 'left'
      clearFix = true
    }

    const renderedControlItems = imageControls.map((item, index) => {

      if (typeof item === 'string' && imageControlItems[item]) {
        return (
          <a className={item === 'link' && link ? 'active' : ''} key={index} href='javascript:void(0);' onClick={() => this.executeCommand(imageControlItems[item].command)}>
            {imageControlItems[item].text}
          </a>
        )
      } else if (item && (item.render || item.text)) {
        return item.render ? item.render(mediaData) : <a key={index} href='javascript:void(0);' onClick={() => item.onClick && this.executeCommand(item.onClick)}>{item.text}</a>
      } else {
        return null
      }

    })

    return (
      <div className='bf-media'>
        <div
          style={{...imageStyles, width}}
          draggable={true}
          onMouseEnter={this.showToolbar}
          onMouseMove={this.showToolbar}
          onMouseLeave={this.hideToolbar}
          onDragStart={this.handleDragStart}
          onDragEnd={this.handleDragEnd}
          ref={instance => this.mediaEmbederInstance = instance}
          className='bf-image'
        >
          {toolbarVisible ? (
            <div
              style={{marginLeft: toolbarOffset}}
              ref={instance => this.toolbarElement = instance}
              data-float={float}
              data-align={alignment}
              className='bf-media-toolbar'
            >
              {linkEditorVisible ? (
                <div className='bf-image-link-editor'>
                  <div className='editor-input-group'>
                    <input type='text' placeholder={language.linkEditor.inputWithEnterPlaceHolder} onKeyDown={this.handleLinkInputKeyDown} onChange={this.setImageLink} defaultValue={link}/>
                    <button type='button' onClick={this.confirmImageLink}>{language.base.confirm}</button>
                  </div>
                  <div className='switch-group'>
                    <Switch
                      active={link_target === '_blank'}
                      onClick={() => this.setImageLinkTarget(link_target)}
                    />
                    <label>{language.linkEditor.openInNewWindow}</label>
                  </div>
                </div>
              ) : null}
              {sizeEditorVisible ? (
                <div className='bf-image-size-editor'>
                  <div className='editor-input-group'>
                    <input type='text' placeholder={language.base.width} onKeyDown={this.handleSizeInputKeyDown} onChange={this.setImageWidth} defaultValue={width}/>
                    <input type='text' placeholder={language.base.height} onKeyDown={this.handleSizeInputKeyDown} onChange={this.setImageHeight} defaultValue={height}/>
                    <button type='button' onClick={this.confirmImageSize}>{language.base.confirm}</button>
                  </div>
                </div>
              ) : null}
              {captionEditorVisible? (
                <div className='bf-image-size-editor'>
                  <div className='editor-input-group'>
                    <input type='text' placeholder={'Caption'} onKeyDown={this.handleCaptionInputKeyDown} onChange={this.setImageCaption} defaultValue={caption}/>
                    <button type='button' onClick={this.confirmImageCaption}>{language.base.confirm}</button>
                  </div>
                </div>
              ) : null}
              {renderedControlItems}
              <i style={{marginLeft: toolbarOffset * -1}} className='bf-media-toolbar-arrow'></i>
            </div>
          ) : null}
          <img
            ref={instance => this.imageElement = instance}
            src={url}
            width={'100%'}
            height={height}
            {...meta}
          />
          {caption? <span style={{color: 'rgb(102, 102, 102)', fontSize: '12px'}}>{caption}</span>: null }
        </div>
        {clearFix && <div className='clearfix' style={{clear:'both',height:0,lineHeight:0,float:'none'}}></div>}
      </div>
    )

  }

  lockEditor () {
    this.props.editor.lockOrUnlockEditor(true)
  }

  unlockEditor () {
    this.props.editor.lockOrUnlockEditor(false)
  }

  calcToolbarOffset () {

    if (!this.props.containerNode) {
      return 0
    }

    const viewRect = this.props.containerNode.getBoundingClientRect()
    const toolbarRect = this.toolbarElement.getBoundingClientRect()
    const imageRect = this.imageElement.getBoundingClientRect()

    const right = viewRect.right - (imageRect.right - imageRect.width / 2 + toolbarRect.width / 2)
    const left = (imageRect.left + imageRect.width / 2 - toolbarRect.width / 2) - viewRect.left

    if (right < 10) {
      return right - 10
    } else if (left < 10) {
      return left * -1 + 10
    } else {
      return 0
    }

  }

  handleDragStart = () => {

    if (this.props.editor.editorProps.readOnly || this.props.editor.editorProps.disabled) {
      return false
    }

    window.__BRAFT_DRAGING__IMAGE__ = {
      block: this.props.block,
      mediaData: {
        type: 'IMAGE',
        ...this.props.mediaData
      }
    }

    this.setState({
      toolbarVisible: false
    }, () => {
      this.unlockEditor()
    })

    return true

  }

  handleDragEnd = () => {

    window.__BRAFT_DRAGING__IMAGE__ = null
    return false

  }

  executeCommand = (command) => {
    if (typeof command === 'string') {
      const [method, param] = command.split('|')
      this[method] && this[method](param)
    } else if (typeof command === 'function') {
      command(this.props.block, this.props.editorState)
    }
  }

  removeImage = () => {
    this.props.editor.setValue(ContentUtils.removeBlock(this.props.editorState, this.props.block))
    this.unlockEditor()
  }

  toggleLinkEditor = () => {
    this.setState({
      linkEditorVisible: !this.state.linkEditorVisible,
      sizeEditorVisible: false,
      captionEditorVisible: false
    })
  }

  toggleSizeEditor = () => {
    this.setState({
      linkEditorVisible: false,
      sizeEditorVisible: !this.state.sizeEditorVisible,
      captionEditorVisible: false
    })
  }

  toggleCaptionEditor = () => {
    this.setState({
      linkEditorVisible: false,
      sizeEditorVisible: false,
      captionEditorVisible: !this.state.captionEditorVisible
    })
  }

  handleLinkInputKeyDown = (e) => {

    if (e.keyCode === 13) {
      this.confirmImageLink()
    } else {
      return
    }

  }

  setImageLink = (e) => {
    this.setState({ tempLink: e.currentTarget.value })
    return
  }

  setImageLinkTarget (link_target) {

    link_target = link_target === '_blank' ? '' : '_blank'
    this.props.editor.setValue(ContentUtils.setMediaData(this.props.editorState, this.props.entityKey, { link_target }))
    window.setImmediate(this.props.editor.forceRender)

  }

  confirmImageLink = () => {

    const { tempLink: link } = this.state

    if (link !== null) {
      this.props.editor.setValue(ContentUtils.setMediaData(this.props.editorState, this.props.entityKey, { link }))
      window.setImmediate(this.props.editor.forceRender)
    }

  }

  handleSizeInputKeyDown = (e) => {
    if (e.keyCode === 13) {
      this.confirmImageSize()
    } else {
      return
    }
  }

  setImageWidth = ({ currentTarget }) => {

    let { value } = currentTarget

    value && !isNaN(value) && (value = value + 'px')

    this.setState({
      tempWidth: value
    })

    return

  }

  setImageHeight = ({ currentTarget }) => {

    let { value } = currentTarget

    value && !isNaN(value) && (value = value + 'px')

    this.setState({
      tempHeight: value
    })

    return

  }

  confirmImageSize = () => {

    const { tempWidth: width, tempHeight: height } = this.state
    const newImageSize = {}

    width !== null && (newImageSize.width = width)
    height !== null && (newImageSize.height = height)

    this.props.editor.setValue(ContentUtils.setMediaData(this.props.editorState, this.props.entityKey, newImageSize))
    window.setImmediate(this.props.editor.forceRender)

  }

  handleCaptionInputKeyDown = (e) => {
    if (e.keyCode === 13) {
      this.confirmImageCaption()
    } else {
      return
    }
  }

  setImageCaption = ({ currentTarget }) => {

    let { value } = currentTarget

    this.setState({
      tempCaption: value
    })

    return
  }

  confirmImageCaption = () => {
    const { tempCaption: caption } = this.state

    this.props.editor.setValue(ContentUtils.setMediaData(this.props.editorState, this.props.entityKey, { caption }))
    window.setImmediate(this.props.editor.forceRender)
  }

  setImageFloat = (float) => {
    this.props.editor.setValue(ContentUtils.setMediaPosition(this.props.editorState, this.props.block, { float }))
    this.unlockEditor()
  }

  setImageAlignment = (alignment) => {
    this.props.editor.setValue(ContentUtils.setMediaPosition(this.props.editorState, this.props.block, { alignment }))
    this.unlockEditor()
  }

  showToolbar = (event) => {

    if (this.props.editor.editorProps.readOnly || this.props.editor.editorProps.disabled) {
      return false
    }

    event.preventDefault()

    if (!this.state.toolbarVisible) {
      this.setState({
        toolbarVisible: true
      }, () => {
        this.lockEditor()
        this.setState({ toolbarOffset: this.calcToolbarOffset() })
      })
    }

  }

  hideToolbar = (event) => {

    event.preventDefault()

    this.setState({
      toolbarVisible: false
    }, () => {
      this.unlockEditor()
      this.props.editor.requestFocus()
    })

  }

}