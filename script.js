Vue.use(VueMaterial.default);

Vue.config.errorHandler = (err, vm, info) => {
  if (err.message !== "Cannot read property 'badInput' of undefined") {
    console.error(err);
  }
};
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

const app = new Vue({
  el: "#app",
  data() {
    return {
      inType: "file",
      inFile: null,
      inURL: "",
      svgURL: "",
      ogWidth: 0,
      ogHeight: 0,
      customWidth: 0,
      customHeight: 0,
      loading: 0,
      getPipeURL: "",
      isFromURLReady: false,
      scaleFactor: 1
    }
  },
  async mounted() {
    await (new Promise(r => {this.$nextTick(r)}));
    let getPipeURL = `https://getpipe${randomNumber(1, 5)}.herokuapp.com`;
    this.loading = -1;
    fetch(getPipeURL).then(() => {
      this.isFromURLReady = true;
      this.loading = 0;
      this.getPipeURL = `${getPipeURL}/pipe/get`;
    });
  },
  methods: {
    async generateAndDownload() {
      try {
        let img = await getImage(this.svgURL);
        canvas.width = this.customWidth;
        canvas.height = this.customHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let dataURL = canvas.toDataURL();
        img = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 1;
        canvas.height = 1;
        saveAs(dataURL, `svg-${Date.now()}-${this.customWidth}x${this.customHeight}.png`);
      } catch (error) {
        let msg = `${error}`;
        if (msg.startsWith("SecurityError")) {
          alert(`It seems that there was a CORS error here if you want to convert this svg file, you have to download the file to your computer first. And then you have to select that file you downloaded.`);
        } else {
          alert(msg);
          console.log(msg)
        }
        this.resetOptions();
      }
    },
    resetOptions() {
      this.ogWidth = 0;
      this.ogHeight = 0;
      this.customWidth = 0;
      this.customHeight = 0;
      this.svgURL = "";
      this.loading = 0;
      this.scaleFactor = 1;
    },
    async onInUpdate() {
      this.loading = -1;
      switch (this.inType) {
        
        case "file": {
          let file = document.getElementById(this.$refs.file.id)?.files?.[0];
          if (!file) return this.resetOptions();
          let dataURL = await readFile(file, "DataURL");
          this.svgURL = dataURL;
          break;
        };
        case "url": {
          if (!this.inURL) return this.resetOptions();
          let fetched = await fetch(this.getPipeURL, {
            method: "post",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({
              type: "text",
              url: this.inURL
            })
          });
          let json = await fetched.json();
          if (json?.data?.statusCode != 200 || !json.ok) {
            alert("Server is not returned with status code 200!");
            this.resetOptions();
            return;
          }
          this.svgURL = `data:image/svg+xml;utf8,${encodeURIComponent(json.data.body)}`;
          break;
        };
      };

      try {
        let img = await getImage(this.svgURL);
        this.customWidth = img.width * this.scaleFactor;
        this.customHeight = img.height * this.scaleFactor;
        this.ogWidth = img.width;
        this.ogHeight = img.height;
        img = 0;
        if (this.customWidth == 0 || this.customHeight == 0) return this.resetOptions();
      } catch (err) {
        return this.resetOptions();
      } finally {
        this.loading = 0;
      }
      

      
    }
  },
  watch: {
    inType(...args) { this.onInUpdate(...args) },
    inFile(...args) { this.onInUpdate(...args) },
    inURL(...args) { this.onInUpdate(...args) },
    scaleFactor(newFactor) {
      if (isNaN(newFactor)) return;
      this.customWidth = this.ogWidth * newFactor;
      this.customHeight = this.ogWidth * newFactor;
    }
  }
});

/**
 * @param {Number} min 
 * @param {Number} max 
 * @returns {Number}
 */
function randomNumber(min, max) { 
  return Math.floor(Math.random() * (max - min) + min);
} 

/**
 * @param {File} file 
 * @param {"Text"|"ArrayBuffer"|"DataURL"|"BinaryString"} as 
 * @param {String} encoding
 * @returns 
 */
function readFile(file, as = "Text", encoding=null) {
  return new Promise((res, rej) => {
    let reader = new FileReader();
    reader.onload = () => {
      res(reader.result);
      reader = 0;
    };
    reader.onerror = (err) => {
      rej(err);
      reader = 0;
    };
    reader[`readAs${as}`](file,encoding);
  })
}

/**
 * @param {String} src 
 * @returns {HTMLImageElement}
 */
function getImage(src = "") {
  return new Promise((res, rej) => {
    let img = new Image();
    img.addEventListener("load", () => {
      res(img);
    }, { once: true });
    
    img.addEventListener("error", (err) => {
      rej(err);
      img = 0;
    }, { once: true });
    img.src = src;
  })
}