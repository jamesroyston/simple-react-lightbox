import React, { Component } from "react";
import PropTypes from "prop-types";
import { withContext } from "../SRLHoc";

class SRLImagesContext extends Component {
  static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node
    ]).isRequired,
    context: PropTypes.object,
    grabImages: PropTypes.func
  };

  constructor() {
    super();
    this.imgContainer = React.createRef();
  }

  componentDidMount() {
    const content = this.imgContainer.current;
    const images = content.getElementsByTagName("img");
    const imagesArray = [...images];
    imagesArray.map((i, index) => {
      i.addEventListener("click", e => {
        // We pass some argument to the function which are needed to update the state with the selected image
        this.props.context.handleLightbox(
          e.target.currentSrc,
          e.target.alt,
          e.target.id
        );
      });
    });
    this.props.context.grabImages(imagesArray);
  }

  render() {
    return <div ref={this.imgContainer}>{this.props.children}</div>;
  }
}

// We wrap this using our HOC component so we have access to the context
export default withContext(SRLImagesContext);