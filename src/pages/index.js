/*
 *
 * Home
 *
 */

import React from 'react';

import clm from 'clmtrackr';

import './style.css';
/**
 * 获取两个坐标的距离
 * @param {*} positions
 * @param {*} index
 * @param {*} index2
 */
const getDiffPosition = (positions, index, index2) => {
	const xdiff = positions[index][0] - positions[index2][0];
	const ydiff = positions[index][1] - positions[index2][1];
	return Math.pow(xdiff * xdiff + ydiff * ydiff, 0.5);
};
/**
 * 人脸坐标检测
 * @param {*} positions
 * @param {*} prePosition
 * @param {*} type
 * @param {*} success
 */
const checkPosition = (positions, prePosition, type, success) => {
	if (type === 'mouse') {
		//眼睛和鼻子距离
		const diffEye = getDiffPosition(positions, 62, 27);
		//上嘴唇 和下嘴唇距离
		const diffMouse = getDiffPosition(positions, 53, 47);
		//眼睛和鼻子距离
		const diffPreEye = getDiffPosition(prePosition, 62, 27);
		//上嘴唇 和下嘴唇距离
		const diffPreMouse = getDiffPosition(prePosition, 53, 47);
		//上次的眼鼻距离和这次的眼鼻距离差
		var dn = Math.abs(diffEye - diffPreEye);
		//上次的嘴距离和本次的嘴距离差
		var dm = Math.abs(diffMouse - diffPreMouse);
		//鼻子的位置确保变化不大
		if (
			prePosition[62][0] > 0 &&
			prePosition[62][1] > 0 &&
			Math.abs(positions[62][0] - prePosition[62][0]) < 5 &&
			Math.abs(positions[62][1] - prePosition[62][1]) < 5
		) {
			if (diffPreEye > 0 && dn < diffEye * 1 / 50) {
				if (diffPreMouse > 0 && dm > diffMouse / 10) {
					success();
				}
			}
		}
	}
	if (type === 'head') {
		const diffLeft = getDiffPosition(positions, 62, 2);
		const diffRight = getDiffPosition(positions, 12, 62);
		const diffSide = getDiffPosition(positions, 12, 2);
		const diffPreLeft = getDiffPosition(prePosition, 62, 2);
		const diffPreRight = getDiffPosition(prePosition, 12, 62);
		const diffPreLeftRight = diffPreLeft - diffPreRight;
		const diffLeftRight = diffLeft - diffRight;
		if (diffPreLeftRight > 0 && diffLeftRight > diffSide / 3) {
			success();
		}
	}
	if (type === 'eye') {
		const diffEye = getDiffPosition(positions, 62, 27); //dis_eye_norse1
		const diffEye2 = getDiffPosition(positions, 62, 32); //dis_eye_norse2
		const diffEyeNorse = diffEye + diffEye2;// dis_eye_norse
		const diffPreEye = getDiffPosition(prePosition, 62, 27); //dis_eye_norse1
		const diffPreEye2 = getDiffPosition(prePosition, 62, 32); //dis_eye_norse2
		const diffPreEyeNorse = diffPreEye + diffPreEye2;// dis_eye_norse
		if (prePosition[62][0] > 0 && prePosition[62][1] > 0
			&& Math.abs(positions[62][0] - prePosition[62][0]) < 0.5
			&& Math.abs(positions[62][1] - prePosition[62][1]) < 0.5
		) {
			if (diffPreEyeNorse > 0 && (Math.abs(diffEyeNorse - diffPreEyeNorse) > diffEyeNorse * 1 / 20)) {
				success()
			}
		}

	}
};
export default class Home extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			vid: '',
			vidWidth: 0,
			vidHeight: 0,
			overlay: '',
			overlayCC: '',
			trackingStarted: false,
			startValue: '等待模块加载',
			startDisabled: true,
			prePosition: null,
			preTime: 0,
			type: 'mouse',
		};
	}

	componentWillMount() {
		this.ctrack = new clm.tracker({
			faceDetection: {
				useWebWorkers: false,
			},
		});
		this.ctrack.init();
	}

	componentDidMount() {
		let vid = document.getElementById('videoel');
		let overlay = document.getElementById('overlay');
		let overlayCC = overlay.getContext('2d');

		this.setState(
			{
				vid: vid,
			},
			() => {
				this.setState({
					vidWidth: vid.width,
					vidHeight: vid.height,
					overlay: overlay,
					overlayCC: overlayCC,
				});
			}
		);

		navigator.getUserMedia =
			navigator.getUserMedia ||
			navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia ||
			navigator.msGetUserMedia;
		window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;
		// check for camerasupport
		if (navigator.mediaDevices) {
			navigator.mediaDevices.getUserMedia({ video: true }).then(this.gumSuccess).catch(this.gumFail);
		} else if (navigator.getUserMedia) {
			navigator.getUserMedia({ video: true }, this.gumSuccess, this.gumFail);
		} else {
			alert('This demo depends on getUserMedia, which your browser does not seem to support. :(');
		}
		vid.addEventListener('canplay', this.enablestart, false);
	}

	enablestart = () => {
		this.setState({
			startValue: '开始',
			startDisabled: false,
		});
	};

	adjustVideoProportions = () => {
		// resize overlay and video if proportions are different
		// keep same height, just change width

		let vid = this.state.vid;
		let overlay = this.state.overlay;

		let proportion = vid.videoWidth / vid.videoHeight;
		let vidWidth = Math.round(this.state.vidHeight * proportion);

		vid.width = vidWidth;
		overlay.width = vidWidth;

		this.setState({
			vid: vid,
			overlay: overlay,
		});
	};

	gumSuccess = (stream) => {
		// add camera stream if getUserMedia succeeded
		let vid = this.state.vid;

		if ('srcObject' in vid) {
			vid.srcObject = stream;
		} else {
			vid.src = window.URL && window.URL.createObjectURL(stream);
		}
		vid.onloadedmetadata = () => {
			this.adjustVideoProportions();
			vid.play();
		};
		vid.onresize = () => {
			this.adjustVideoProportions();
			if (this.state.trackingStarted) {
				this.ctrack.stop();
				this.ctrack.reset();
				this.ctrack.start(vid);
			}
		};
	};

	gumFail = (error) => {
		if (error.PERMISSION_DENIED) {
			alert('用户拒绝了浏览器请求媒体的权限', '提示');
		} else if (error.NOT_SUPPORTED_ERROR) {
			alert('对不起，您的浏览器不支持拍照功能，请使用其他浏览器', '提示');
		} else if (error.MANDATORY_UNSATISFIED_ERROR) {
			alert('指定的媒体类型未接收到媒体流', '提示');
		} else {
			alert('系统未能获取到摄像头，请确保摄像头已正确安装。或尝试刷新页面，重试', '提示');
		}
	};

	startVideo = () => {
		// start video
		this.state.vid.play();
		// start tracking
		this.ctrack.start(this.state.vid);
		this.setState({
			trackinStarted: true,
		});
		// start loop to draw face
		this.drawLoop();
		this.setState({
			startValue: '请张张嘴',
			startDisabled: true,
		})
	};

	drawLoop = () => {
		requestAnimFrame(this.drawLoop);
		this.state.overlayCC.clearRect(0, 0, this.state.vidWidth, this.state.vidHeight);
		const positions = this.ctrack.getCurrentPosition();
		if (!positions) {
			return;
		}

		this.ctrack.draw(this.state.overlay);
		const { prePosition, preTime, type } = this.state;
		if (preTime === 0) {
			this.setState({
				prePosition: positions,
				preTime: new Date().getTime(),
			});
		}
		// 防抖
		if (type !== 'eye' && !(new Date().getTime() - preTime > 200 && new Date().getTime() - preTime < 10000)) {
			return;
		}
		if (new Date().getTime() - preTime < 5) {
			return;
		}
		if (prePosition) {
			checkPosition(positions, prePosition, type, () => {
				switch (type) {
					case 'mouse':
						this.setState({
							startValue: '请眨眨眼',
							type: 'eye',
							startDisabled: true,
						});
						break;
					case 'eye':
						this.setState({
							startValue: '请摇摇头',
							type: 'head',
							startDisabled: true,
						});
						break;
					case 'head':
						this.setState({
							startValue: '开始',
							type: 'mouse',
							startDisabled: false,
						});
						this.ctrack.stop();
						break;
				}


			});
		}
		this.setState({
			prePosition: positions,
			preTime: new Date().getTime(),
		});
	};

	render() {
		return (
			<div className='container'>
				<div id='container'>
					<video id='videoel' width='400' height='300' preload='auto' loop playsInline autoPlay />
					<canvas id='overlay' width='400' height='300' />

					<input
						className='btn'
						type='button'
						value={this.state.startValue}
						disabled={this.state.startDisabled}
						onClick={this.startVideo}
						id='startbutton'
					/>
				</div>
			</div>
		);
	}
}

// Helper Functions
/**
 * Provides requestAnimationFrame in a cross browser way.
 */
window.requestAnimFrame = (function () {
	return (
		window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function (/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
			return window.setTimeout(callback, 1000 / 60);
		}
	);
})();

/**
 * Provides cancelRequestAnimationFrame in a cross browser way.
 */
window.cancelRequestAnimFrame = (function () {
	return (
		window.cancelAnimationFrame ||
		window.webkitCancelRequestAnimationFrame ||
		window.mozCancelRequestAnimationFrame ||
		window.oCancelRequestAnimationFrame ||
		window.msCancelRequestAnimationFrame ||
		window.clearTimeout
	);
})();
