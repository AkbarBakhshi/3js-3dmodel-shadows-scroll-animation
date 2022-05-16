import * as THREE from 'three'
import gsap from 'gsap'
// import GUI from 'lil-gui'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import LocomotiveScroll from 'locomotive-scroll';
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

export default class {
    constructor() {
        // this.gui = new GUI()

        this.threejsCanvas = document.querySelector('.threejs__canvas__container')
        this.width = this.threejsCanvas.offsetWidth
        this.height = this.threejsCanvas.offsetHeight

        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000)
        this.camera.position.set(0, -10, 0)
        this.camera.lookAt(0, 0, 0)

        // this.gui.add(this.camera.position, 'x').min(-50).max(50).step(1).name('camera position x')
        // this.gui.add(this.camera.position, 'y').min(-50).max(50).step(1).name('camera position y')
        // this.gui.add(this.camera.position, 'z').min(-50).max(50).step(1).name('camera position z')

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })

        this.renderer.setSize(this.width, this.height)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.threejsCanvas.appendChild(this.renderer.domElement)

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

        this.setUpScene()
        this.addLights()

        this.locoScroll = new LocomotiveScroll({
            el: document.querySelector('.threejs'),
            smooth: true,
            smartphone: {
                smooth: true
            },
            tablet: {
                smooth: true
            }
        });

        // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        // this.controls.enableDamping = true

        // const axesHelper = new THREE.AxesHelper(20);
        // this.scene.add(axesHelper);

    }

    setUpScene() {
        const parkLoader = new GLTFLoader()
        parkLoader.load('/models/city_park_at_sunset/scene.gltf', (gltf) => {
            this.park = gltf.scene
            gltf.scene.traverse(item => {
                // console.log(item)
                if (item.name === 'volpe_Material001_0') {
                    this.wolf = item
                }
                if (item.name === 'acqua_acqua_0') {
                    this.water = item
                }
                item.castShadow = false
                item.receiveShadow = true
            })

            this.wolf.castShadow = true
            this.wolf.receiveShadow = false

            this.water.receiveShadow = false

            this.scene.add(gltf.scene)

            this.setupScrollAnimation()
        })
    }

    addLights() {
        this.light = new THREE.DirectionalLight(0xFFFFFF, 3)
        this.light.position.set(10, 10, 0)

        //Set up shadow properties for the light
        this.light.castShadow = true
        this.light.shadow.mapSize.width = 512; // default
        this.light.shadow.mapSize.height = 512; // default
        this.light.shadow.camera.near = 0.5; // default
        this.light.shadow.camera.far = 500; // default
        this.scene.add(this.light)

        // this.gui.add(this.light, 'intensity').min(0).max(10).step(0.1).name('light intensity')

        // const helper = new THREE.CameraHelper(this.light.shadow.camera);
        // this.scene.add(helper);
    }

    locoUpdate() {
        try {
            // console.log('about scroll loco update')
            this.locoScroll.update()
        } catch {
            // console.log('error on about loco resize caught')
        }
    }

    setupScrollAnimation() {
        this.light.target = this.wolf

        this.locoScroll.on("scroll", () => {
            try {
                ScrollTrigger.update();
            } catch {
                console.log("error on scroll trigger caught")
            }
        });

        ScrollTrigger.scrollerProxy('.threejs', {
            scrollTop: (value) => {
                return arguments.length ? this.locoScroll.scrollTo(value, 0, 0) : this.locoScroll.scroll.instance.scroll.y;
            }, // we don't have to define a scrollLeft because we're only scrolling vertically.
            getBoundingClientRect() {
                return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
            },
            // LocomotiveScroll handles things completely differently on mobile devices - it doesn't even transform the container at all! So to get the correct behavior and avoid jitters, we should pin things with position: fixed on mobile. We sense it by checking to see if there's a transform applied to the container (the LocomotiveScroll-controlled element).
            pinType: document.querySelector('.threejs').style.transform ? "transform" : "fixed"
        })

        ScrollTrigger.addEventListener("refresh", () => this.locoUpdate())

        gsap.timeline({
            scrollTrigger: {
                scroller: ".threejs",
                trigger: '.threejs__story',
                start: 'top top',// when the top of the trigger hits the top of the viewport
                end: "bottom bottom",
                scrub: 1
            }
        })
            .to(this.camera.position, { x: 0, y: -100, z: 50 })
            .to(this.park.rotation, { x: Math.PI / 2, y: 0, z: 0 })
            .to(this.park.position, { x: 0, y: -90, z: 45 }, '<')
            .to(this.light.position, { x: 10, y: -100, z: 50 }, '<')
            
    }

    onMouseDown() {
    }

    onMouseUp() {
    }

    onMouseMove() {
    }

    update() {

        ScrollTrigger.refresh()

        this.renderer.render(this.scene, this.camera)
        // this.controls.update()
    }


    onResize() {
        this.width = this.threejsCanvas.offsetWidth
        this.height = this.threejsCanvas.offsetHeight

        this.renderer.setSize(this.width, this.height)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        this.camera.aspect = this.width / this.height
        this.camera.updateProjectionMatrix()

    }

    /**
     * Destroy.
     */
    destroy() {
        $('.c-scrollbar').remove()
        this.locoScroll.destroy()
        this.locoScroll.stop()
        this.destroyThreejs(this.scene)
    }

    destroyThreejs(obj) {
        while (obj.children.length > 0) {
            this.destroyThreejs(obj.children[0]);
            obj.remove(obj.children[0]);
        }
        if (obj.geometry) obj.geometry.dispose();

        if (obj.material) {
            //in case of map, bumpMap, normalMap, envMap ...
            Object.keys(obj.material).forEach(prop => {
                if (!obj.material[prop])
                    return;
                if (obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function')
                    obj.material[prop].dispose();
            })
            // obj.material.dispose();
        }
    }
}