<template>
  <div class="container">
    <div class="inputs-container">
      <input :style="`display:${(debug) ? 'block' : 'none'};`" class="form-control form-control-sm" type="file"
        id="formFile" v-on:change="updateImage">

      <input :style="`display:${(debug) ? 'block' : 'none'};`" type="text" class="form-control form-control-sm"
        placeholder="Ancho" v-model="width" />

      <input :style="`display:${(debug) ? 'block' : 'none'};`" type="text" class="form-control form-control-sm"
        placeholder="Alto" v-model="height">

      <input :style="`display:${(debug) ? 'block' : 'none'};`" type="text" class="form-control form-control-sm"
        placeholder="X:" v-model="x">

      <input :style="`display:${(debug) ? 'block' : 'none'};`" type="text" class="form-control form-control-sm"
        placeholder="Y:" v-model="y">

      <input id="fileselector" type="file" v-on:change="setFolder" webkitdirectory directory multiple="false"
        :style="`display: ${(debug) ? 'block' : 'none'};`" />


      <div class="mb-3 nondebugcontainer">
        <div class="row">
          <div class="col-sm">
            <input type="text" class="form-control form-control-sm" placeholder="Texto" v-model="text">
          </div>
          <div class="col-sm">
            <input type="text" class="form-control form-control-sm" placeholder="Tamaño Fuente" v-model="fontsize">
          </div>
          <div class="col-sm">
            <input type="text" class="form-control form-control-sm" placeholder="Color" v-model="color">
          </div>
        </div>
      </div>

      <span class="buttons-container">
          <a href="javascript:void(0)" v-on:click="uploadFile" id="Subir" class="btn btn-dark">Subir foto</a>
          <a href="javascript:void(0)" v-on:click="download(); success('Tarjeta emitida.')" id="Descargar"
            class="btn btn-dark">Descargar</a>
          <a href="javascript:void(0)" v-on:click="processList" id="ProcessList" class="btn btn-dark">Automatico</a>
          <a href="javascript:void(0)" v-if="!isLinux" v-on:click="selectFolder" id="SelectFolder"
            class="btn btn-dark">Salida</a>

      </span>
    </div>

    <div class="canvas-container">
      <canvas id="canvas">
      </canvas>
    </div>

  </div>
</template>

<script>
/* eslint-disable */
import HelloWorld from './components/HelloWorld.vue'
import { useToast } from "vue-toastification";
export default {
  name: 'App',
  components: {

  },
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      height: 0,
      width: 0,
      x: 340,
      y: 380,
      text: 'NOMBRE DEL INVITADO',
      color: 'black',

      font: 'Poppins',
      fontsize: 40,

      image: '',
      debug: true,

      outDir: '',
      isLinux: ''
    }
  },
  mounted() {
    window.ipcRenderer.on("info", (event, arg) => {
      this.toast.success(`${arg.message}`);
    });

    window.ipcRenderer.send("isLinux");
    window.ipcRenderer.on("isLinuxResponse", (evt, response) => {
      this.isLinux = response.data;
    });
  },
  methods: {
    updateText() {
      let canvas = document.getElementById('canvas');
      let ctx = canvas.getContext('2d');

      ctx.fillStyle = 'rgb(214, 214, 214)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (this.image) {
        ctx.drawImage(this.image, 0, 0);
      }

      ctx.font = `bold ${this.fontsize}px ${this.font}`;
      ctx.fillStyle = `${this.color}`;
      ctx.textBaseline = 'top';
      ctx.fillText(this.text, this.x - ctx.measureText(this.text).width / 2, this.y);

    },
    updateImage(arg) {
      const file = arg.target.files[0]; // 0 = get the first file
      let url = window.URL.createObjectURL(file);
      this.image = new Image();
      this.image.src = url;

      let self = this;
      this.image.onload = function () {
        self.width = this.width;
        self.height = this.height;
      }

      this.updateText();
    },
    async download() {
      let canvas = document.getElementById('canvas');
      window.ipcRenderer.send("download", {
        url: canvas.toDataURL(),
        properties: { directory: this.outDir, name: this.text }
      });
    },
    async processList() {
      window.ipcRenderer.send("getList");
      window.ipcRenderer.on("getListResponse", async (event, response) => {
        let data = response.data;
        let invitados = data.split(',').map(i => i.trim());

        console.log("INVITADOS: ", invitados)

        for (const invitado of invitados) {
          console.log(invitado)
          this.text = invitado;
          this.updateText();
          // await new Promise(resolve => setTimeout(resolve, 300)); // asegurarse de que el texto se actualizó
          await this.sendDownload(); // espera hasta que el archivo esté listo
        }

        this.success("Todas las tarjetas fueron emitidas.");
      });
    },
    async sendDownload() {
      return new Promise((resolve) => {
        window.ipcRenderer.once("downloadComplete", () => resolve());

        const canvas = document.getElementById('canvas');
        window.ipcRenderer.send("download", {
          url: canvas.toDataURL(),
          properties: { directory: this.outDir, name: this.text }
        });
      });
    },

    uploadFile() {
      document.getElementById('formFile').click()
    },
    success(msg) {
      this.toast.success(msg);
    },
    selectFolder() {
      document.getElementById('fileselector').click();
    },
    setFolder(evt) {
      this.outDir = document.getElementById('fileselector').files[0].path;
      this.outDir = this.cleanPath(this.outDir);
      this.success(`Directorio de salida actualizado: ${this.outDir}`);
    },
    cleanPath(path) {
      let ret = '';
      let splitted = path.split('/');
      splitted.splice(-1);

      splitted.map((subfolder) => {
        ret += subfolder + '/';
      });
      return ret;
    },
  },
  watch: {
    width: {
      handler: function (v) {
        document.getElementById('canvas').width = v;
        this.updateText();
      },
    },
    height: {
      handler: function (v) {
        document.getElementById('canvas').height = v;
        this.updateText();
      },
    },
    text: {
      handler: function (v) {
        this.updateText();
      }
    },
    fontsize: {
      handler: function (v) {
        this.updateText();
      }
    },
    color: {
      handler: function (v) {
        this.updateText();
      }
    },
    x: {
      handler: function () { this.updateText(); }
    },
    y: {
      handler: function () { this.updateText(); }
    },
    image: {
      handler: function (v) {
        this.updateText();
      }
    }
  },

}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Alkatra&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  background-color: gray;

  display: block;
  margin: auto;
}

.inputs-container {
  display: flex;
  flex-direction: column;

  //background-color: aquamarine;

  width: 90%;
  height: fit-content;
  margin: auto;

  &>input {
    margin-top: 1em;
  }
}

.canvas-container {
  &>canvas {
    display: block;

    margin: auto;
    margin-top: 2em;

  }
}

#Descargar,
#ProcessList,
#Subir,
#SelectFolder {
  width: 8em;
  margin-top: 1em;
  margin-right: 1em;
}

.nondebugcontainer {
  margin-top: 2em;
}

.buttons-container {}
</style>
