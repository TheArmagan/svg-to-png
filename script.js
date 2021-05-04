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
      customWidth: 0,
      customHeight: 0
    }
  },
  methods: {
    async generateAndDownload() {
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
    },
    resetOptions() {
      this.customWidth = 0;
      this.customHeight = 0;
      this.svgURL = "";
    },
    async onInUpdate() {
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
          this.svgURL = this.inURL;
          break;
        };
      };

      try {
        let img = await getImage(this.svgURL);
        this.customWidth = img.width;
        this.customHeight = img.height;
        img = 0;
        if (
          this.customWidth == 0 ||
          this.customHeight == 0
        ) return this.resetOptions();
      } catch {
        return this.resetOptions();
      }

      
    }
  },
  watch: {
    inType(...args) { this.onInUpdate(...args) },
    inFile(...args) { this.onInUpdate(...args) },
    inURL(...args) { this.onInUpdate(...args) }
  }
});

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
    if (src.toLowerCase().indexOf("http") != -1) {
      img.addEventListener("load", () => {
        res(img);
      }, { once: true });
    } else {
      res(img);
    }
    
    img.addEventListener("error", (err) => {
      rej(err);
      img = 0;
    }, { once: true });
    img.src = src;
  })
}