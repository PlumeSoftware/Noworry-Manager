<template>
  <div class="form-btns">
    <div class="btn">
      <n-button round @click="updateData()">刷新</n-button>
    </div>
    <div class="btn">
      <!-- <n-button v-for="(item, index) in typeGroup" :key="index">
        {{ item.categoryName }}
      </n-button> -->
      <n-button><b>商品列表</b></n-button>
    </div>
    <div class="btn">
      <n-button type="primary" @click="edit()">新增</n-button>
    </div>
  </div>
  <div class="list">
    <n-data-table :columns="columns" :data="data" :pagination="pagination" />
  </div>

  <div class="dialog" v-if="dialog">
    <n-card
      style="width: 600px"
      title="商品详情"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <n-form
        ref="formRef"
        :model="editing"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
        :style="{
          maxWidth: '640px',
        }"
      >
        <n-form-item label="商品名称" path="inputValue">
          <n-input
            v-model:value="editing.commodityName"
            placeholder="如 法国签证刷签"
          />
        </n-form-item>
        <n-form-item label="商品价格" path="inputValue">
          <n-input
            v-model:value="editing.currentPrice"
            placeholder="请输入英镑价格"
          />
        </n-form-item>

        <n-form-item label="商品区域">
          <n-radio-group v-model:value="editing.commodityType">
            <n-radio :value="15">美签</n-radio>
            <n-radio :value="11">申根</n-radio>
            <n-radio :value="12">北欧</n-radio>
            <n-radio :value="13">美签</n-radio>
            <n-radio :value="14">日本</n-radio>
            <n-radio :value="16">新加坡</n-radio>
          </n-radio-group>
        </n-form-item>

        <n-form-item label="商品简介" path="inputValue">
          <n-input
            v-model:value="editing.commodityBrief"
            placeholder="请输入商品简介"
          />
        </n-form-item>
        <n-form-item label="商品图片">
          <n-upload :max="1" list-type="image" :custom-request="onUploadFin">
            <n-button>上传文件</n-button>
          </n-upload>
        </n-form-item>
        <n-form-item label="商品提示">
          <n-button @click="showModal = true">点击查看或修改</n-button>
          <n-modal
            v-model:show="showModal"
            class="custom-card"
            preset="card"
            title="Tips管理"
            size="huge"
            style="min-width: 640px; width: 70vw"
            :bordered="false"
          >
            <TransitionGroup name="list">
              <div v-for="(tip, i) in editing.tips" :key="tip.id">
                <ReTips
                  :title="tip.title"
                  :children="tip.children"
                  :path="[i]"
                  @add="onADD"
                  @update="onUPA"
                  @del="onDEL"
                  @up="onUP"
                  @sub="onSUB"
                />
              </div>
              <n-button
                v-if="!editing.tips.length"
                tag="div"
                dashed
                type="info"
                style="width: 88%"
                @click="newTips"
                >新建项</n-button
              >
            </TransitionGroup>
          </n-modal>
        </n-form-item>
      </n-form>

      <div class="dialog-btns">
        <div class="btn" @click="hideDialog()">
          <n-button round>取消</n-button>
        </div>
        <div class="btn">
          <n-button
            round
            type="primary"
            @click="submit()"
            :disabled="permissionForSave"
            >上传</n-button
          >
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h } from "vue";
import {
  NModal,
  NButton,
  NDataTable,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NRadioGroup,
  NRadio,
  NUpload,
  createDiscreteApi,
  UploadCustomRequestOptions,
} from "naive-ui";
import type {
  DataTableColumns,
  DataTableRowKey,
  UploadFileInfo,
} from "naive-ui";
import axios, { AxiosResponse } from "axios";
import ReTips from "../components/ReTips.vue";
import {
  componentPros,
  createEnv,
  editingData,
  EnvType,
} from "@/method/targetTreePath";
type VisaResult = {
  commodityId: number;
  commodityType: number;
  commodityName: string;
  commodityBrief: string;
  initialQuantity: number;
  remainQuantity: number;
  originPrice: number;
  currentPrice: number;
  commodityStatus: number;
  picLink: string;
  picLinkTem: string;
  tips: componentPros[];
};

const createColumns = (): DataTableColumns<VisaResult> => [
  {
    title: "商品名称",
    align: "center",
    width: 200,
    key: "commodityName",
  },
  {
    title: "商品区域",
    align: "center",
    width: 80,
    key: "commodityType",
    sorter: "default",
    render(row) {
      return h("div", null, {
        default: () => {
          switch (Number(row.commodityType)) {
            case 11:
              return "申根";
            case 12:
              return "北欧";
            case 13:
              return "美签";
            case 14:
              return "日本";
            case 15:
              return "英国";
            case 16:
              return "新加坡";
          }
        },
      });
    },
  },
  {
    title: "简介",
    align: "center",
    width: 220,
    key: "commodityBrief",
  },
  {
    title: "操作",
    align: "center",
    width: 100,
    key: "actions",
    render(row) {
      return h(
        "div",
        {
          style: "display:flex",
        },
        {
          default: () => [
            h(NButton, { onClick: () => edit(row) }, { default: () => "编辑" }),
            h(
              NButton,
              { onClick: () => deleteData(row.commodityId), type: "error" },
              { default: () => "删除" },
            ),
          ],
        },
      );
    },
  },
];

//编辑或新增商品
const dialog = ref(false);
const editing = reactive<editingData>({
  commodityId: null,
  commodityName: "",
  commodityType: 11,
  currentPrice: "",
  commodityBrief: "",
  originPrice: null,
  commodityStatus: 0,
  picLink: "",
  picLinkTem: "",
  tips: [],
});

const edit = function (row?: VisaResult) {
  //用户点击"编辑"触发的回调函数
  dialog.value = !dialog.value;
  console.log(row);
  //触发时可能要在其他地方使用row数据,所以把row赋值到全局的另一个变量中
  if (row) {
    const keys = Object.keys(row);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    keys.forEach((key) => (editing[key] = row[key]));
  } else {
    editing.commodityId = null;
    editing.commodityName = "";
    editing.commodityType = 11;
    editing.currentPrice = "";
    editing.commodityBrief = "";
    editing.originPrice = null;
    editing.picLink = "2";
    editing.picLinkTem = "2";
  }
};

const deleteData = function (commodityId: number) {
  const result = confirm("确定删除?");
  if (result) {
    axios({
      url: `/v2/mp/manager/visa/${commodityId}`,
      method: "delete",
    })
      .then(() => {
        alert("删除成功");
        updateData();
      })
      .catch(() => {
        alert("删除失败");
      });
  }
};

const submit = function () {
  axios({
    url: `/v2/mp/manager/visa`,
    method: "POST",
    data: editing,
  })
    .then(() => {
      alert("修改成功");
      updateData();
      hideDialog();
    })
    .catch(() => {
      alert("修改失败");
    });
};

const hideDialog = () => {
  dialog.value = false;
};

const checkedRowKeysRef = ref<DataTableRowKey[]>([]);

const data: VisaResult[] = reactive([]);

const typeGroup: unknown[] = reactive([]);

const updateData = function () {
  while (data.length) {
    data.pop();
  }

  axios({
    url: `/v2/mp/manager/visa`,
  }).then((res) => {
    //给tips加id
    res.data.forEach((e: VisaResult) => {
      treeTransvalAddId(e.tips);
    });
    //以深度优先遍历的方法给tips加id
    function treeTransvalAddId(arr: componentPros[]) {
      if (arr.length > 0) {
        arr.forEach((e) => {
          e.id = Symbol();
          treeTransvalAddId(e.children);
        });
      } else return;
    }
    data.push(...res.data);
  });
};

//上传文件前的回调
function beforeFileUpload(fileinfo: UploadFileInfo): boolean | void {
  if (fileinfo.file) {
    const { notification } = createDiscreteApi(["notification"]);
    if (fileinfo.file.type.indexOf("image") === -1) {
      notification.create({
        duration: 4000,
        type: "error",
        title: "无法上传非图片文件",
      });
      return false; //不允许上传
    }
  }
  return true; //true:允许上传
}
const permissionForSave = ref(false);
async function onUploadFin(options: UploadCustomRequestOptions) {
  if (options.file.file) {
    const { notification } = createDiscreteApi(["notification"]);
    //弹出提示
    if (options.file.file.size > 1024 * 10240) {
      notification.create({
        duration: 4000,
        type: "warning",
        title: "图片大小大于10MB，将图片导致加载缓慢",
      });
    }

    const formdata = new FormData();
    formdata.append("image", options.file.file);
    formdata.append("key", "3e5e34bf9dc1a6f682ca719f3e9aeb45");

    //文件上传前静止提交表单
    permissionForSave.value = true;
    //上传至服务器
    type resposeType = AxiosResponse<{
      status: boolean;
      data: { image: { url: string }; medium: { url: string } };
    }>;
    const respose: resposeType = await axios({
      url: "https://4997xs4632.goho.co/v2/mp/manager/visa/picture",
      method: "POST",
      data: formdata,
      headers: { "content-type": "multipart/form-data" },
    });
    //将服务器返回的图片地址记录下来if (respose.data)i
    editing.picLink = respose.data.data.image.url;
    editing.picLinkTem = respose.data.data.medium.url; //记录后就可以提交表单了
    permissionForSave.value = false;
  }
}
//控制tips模态框的出现
const showModal = ref(false);
//检测到子组件发送的事件
const onADD = createEnv(editing, EnvType.ADD);
const onUPA = createEnv(editing, EnvType.UPD);
const onDEL = createEnv(editing, EnvType.DEL);
const onUP = createEnv(editing, EnvType.UPP);
const onSUB = createEnv(editing, EnvType.SUB);
function newTips() {
  editing.tips.push({ id: Symbol(), children: [], title: "", path: [0] });
}
updateData();
const columns = createColumns();
const pagination = {
  pageSize: 6,
};
</script>

<style>
.form-btns {
  height: 8vh;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 70vw;
  margin: 0 auto;
}

.list {
  width: 75vw;
  margin: 0 auto;
}

.dialog {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  background-color: rgba(0, 0, 0, 0.3);
  transition: 0.5s;
  width: 100vw;
  height: 100vh;

  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog-btns {
  width: 15vw;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  margin: 0 auto;
}
.list-move, /* 对移动中的元素应用的过渡 */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
