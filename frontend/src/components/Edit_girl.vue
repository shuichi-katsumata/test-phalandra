<template>
  <tbody>
    <tr>
      <th class="text-center table_title" colspan="2">女の子編集</th>
    </tr>
    <tr>
      <th>公開設定</th>
        <td>
          <ul class="list-unstyled d-flex justify-content-start" style="margin: 0;">
            <li class="me-2"><label><input type="radio" v-model="data.situation" value="public" checked="checked">公開</label></li>
            <li class="ms-2 me-2"><label><input type="radio" v-model="data.situation" value="private">非公開</label></li>
          </ul>
        </td>
    </tr>
    <tr>
      <th>
        名前
        <p class="fw-normal text-danger cautionary_note mb-0">※名前の変更は出来ません。</p>
      </th>
      <td><p class="fw-bold text-secondary mb-0">{{ data.castName }}</p></td>
    </tr>
    <tr>
      <th>入店日</th>
      <td>
        <div class="d-flex justify-content-start align-items-center" style="margin: 0;">
          <Datepicker
            style="width:200px;"
            v-model="data.entryDate"
            locale="jp"
            select-text="選択"
            cancel-text="ｷｬﾝｾﾙ"
            placeholder="日付を選択"
            :enable-time-picker="false"
            format="yyyy-MM-dd"
            model-type="yyyy-MM-dd"
            auto-apply
          />
          <p class="ms-2 me-2" style="margin: 0;">入店日より60日間は新人期間になります。</p>
        </div>
      </td>
    </tr>
    <tr>
      <th>
        入店経路
        <div>
          <span class="bg-danger text-white p-1 cautionary_note rounded-1" style="margin-bottom: 0;">※必須</span>
        </div>
      </th>
      <td>
        <select style="width: 15%;" v-model="data.entryRoute">
          <option value="01">ガールズヘブン</option>
          <option value="02">他求人媒体</option>
          <option value="99">その他</option>
        </select>
      </td>
    </tr>
    <tr>
      <th>
        各種フラグ
        <p class="fw-normal text-danger cautionary_note mb-0">※最大6つ迄のご登録となります（ピックアップ・プライズ除く）7個以上ご登録されるとレイアウトが崩れますのでご注意下さい。</p>
        <p class="fw-normal text-primary cautionary_note">※PCR検査済／ワクチン接種済はどちらか1つご選択ください。1つのみ表示されます。</p>
      </th>
      <td>
        <ul class="list-unstyled d-flex flex-wrap" style="margin: 0;">
          <li v-for="flag in flags" :key="flag.value" class="me-4">
            <label>
              <input type="checkbox" v-model="data.flags" :value="flag.value">{{ flag.label }}
            </label>
          </li>
        </ul>
      </td>
    </tr>
    <tr>
      <th>
        年齢
        <div>
          <span class="bg-danger text-white p-1 cautionary_note rounded-1" style="margin-bottom: 0;">※必須</span>
        </div>
      </th>
      <td>
        <input type="text" class="me-2" style="width: 100px;" v-model="data.age"><span>歳</span>
      </td>
    </tr>
    <tr>
      <th>
        身長
        <div>
          <span class="bg-danger text-white p-1 cautionary_note rounded-1" style="margin-bottom: 0;">※必須</span>
        </div>
      </th>
      <td>
        <input type="text" class="me-2" style="width: 100px;" v-model="data.height"><span>cm</span>
      </td>
    </tr>
    <tr>
      <th>
        3サイズ
        <div>
          <span class="bg-danger text-white p-1 cautionary_note rounded-1" style="margin-bottom: 0;">※必須</span>
        </div>
      </th>
      <td>
        <ul class="list-unstyled d-flex" style="margin: 0;">
          <li><span class="me-2">バスト</span><input type="text" style="width: 100px;" v-model="data.bust"><span class="ms-2">cm</span></li>
          <li><span class="ms-4 me-2">ウエスト</span><input type="text" style="width: 100px;" v-model="data.waist"><span class="ms-2">cm</span></li>
          <li><span class="ms-4 me-2">ヒップ</span><input type="text" style="width: 100px;" v-model="data.hip"><span class="ms-2">cm</span></li>
        </ul>
      </td>
    </tr>
    <tr>
      <th>
        カップ
        <div>
          <span class="bg-danger text-white p-1 cautionary_note rounded-1" style="margin-bottom: 0;">※必須</span>
        </div>
      </th>
      <td>
        <select style="width: 5%;" v-model="data.cup">
          <option v-for="cup in cups" :key="cup.value" :value="cup.value">{{ cup.label }}</option>
        </select>
        <span>カップ</span>
      </td>
    </tr>
    <tr>
      <th>タイプ</th>
      <td>
        <span class="me-1 fw-bold">ヘブン</span>
        <select style="width: 15%;" v-model="data.ch_type">
          <option value="01">カワイイ系</option>
          <option value="02">キレイ系</option>
          <option value="03">ロリ系</option>
          <option value="04">人妻系</option>
        </select>
      </td>
    </tr>
    <tr>
      <th>喫煙</th>
        <td>
          <ul class="list-unstyled d-flex justify-content-start" style="margin: 0; padding: 0;">
            <li class="me-2"><label><input type="radio" v-model="data.smoking" value="1">喫煙する</label></li>
            <li class="ms-2 me-2"><label><input type="radio" v-model="data.smoking" value="2">喫煙しない</label></li>
          </ul>
        </td>
    </tr>
    <tr>
      <th>お酒</th>
        <td>
          <ul class="list-unstyled d-flex justify-content-start" style="margin: 0; padding: 0;">
            <li class="me-2"><label><input type="radio" v-model="data.drink" value="1">飲めない</label></li>
            <li class="ms-2 me-2"><label><input type="radio" v-model="data.drink" value="2">ほどほど</label></li>
            <li class="ms-2 me-2"><label><input type="radio" v-model="data.drink" value="3">大好き</label></li>
          </ul>
        </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <span class="question_margin">項目1</span>
          <input type="text" v-model="data.question1">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer1">
      </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <span class="question_margin">項目2</span>
          <input type="text" v-model="data.question2">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer2">
      </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <span class="question_margin">項目3</span>
          <input type="text" v-model="data.question3">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer3">
      </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <span class="question_margin">項目4</span>
          <input type="text" v-model="data.question4">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer4">
      </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <span class="question_margin">項目5</span>
          <input type="text" v-model="data.question5">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer5">
      </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <span class="question_margin">項目6</span>
          <input type="text" v-model="data.question6">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer6">
      </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <div class="d-flex flex-column question_margin">
            <span>項目7</span>
            <span class="fw-normal text-secondary cautionary_note">※外部</span>
          </div>
          <input type="text" v-model="data.question7">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer7">
      </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <div class="d-flex flex-column question_margin">
            <span>項目8</span>
            <span class="fw-normal text-secondary cautionary_note">※外部</span>
          </div>
          <input type="text" v-model="data.question8">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer8">
      </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <div class="d-flex flex-column question_margin">
            <span>項目9</span>
            <span class="fw-normal text-secondary cautionary_note">※外部</span>
          </div>
          <input type="text" v-model="data.question9">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer9">
      </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <div class="d-flex flex-column me-4">
            <span>項目10</span>
            <span class="fw-normal text-secondary cautionary_note">※外部</span>
          </div>
          <input type="text" v-model="data.question10">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer10">
      </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <div class="d-flex flex-column me-4">
            <span>項目11</span>
            <span class="fw-normal text-secondary cautionary_note">※外部</span>
          </div>
          <input type="text" v-model="data.question11">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer11">
      </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <div class="d-flex flex-column me-4">
            <span>項目12</span>
            <span class="fw-normal text-secondary cautionary_note">※外部</span>
          </div>
          <input type="text" v-model="data.question12">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer12">
      </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <div class="d-flex flex-column me-4">
            <span>項目13</span>
            <span class="fw-normal text-secondary cautionary_note">※外部</span>
          </div>
          <input type="text" v-model="data.question13">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer13">
      </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <div class="d-flex flex-column me-4">
            <span>項目14</span>
            <span class="fw-normal text-secondary cautionary_note">※外部</span>
          </div>
          <input type="text" v-model="data.question14">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer14">
      </td>
    </tr>
    <tr>
      <th>
        <div class="d-flex align-items-center">
          <div class="d-flex flex-column me-4">
            <span>項目15</span>
            <span class="fw-normal text-secondary cautionary_note">※外部</span>
          </div>
          <input type="text" v-model="data.question15">
        </div>
      </th>
      <td>
        <input type="text" class="w-100" v-model="data.answer15">
      </td>
    </tr>
    <tr>
      <th>
        <label><input type="checkbox" v-model="data.cast_freecontents_memory">項目名を記憶する</label>
      </th>
      <td>
        <span class="fs-6">※「項目名を記憶する」にチェックを入れると、現在の項目名（左側の値）を記憶し、次回登録時に項目名の入力を省略できます。チェックを外した場合は、前回記憶した内容を引き継ぎます。</span>
      </td>
    </tr>
    <tr>
      <th>
        キャッチコピー
        <div>
          <span class="bg-danger text-white p-1 cautionary_note rounded-1" style="margin-bottom: 0;">※必須</span>
        </div>
      </th>
      <td><input type="text" class="w-100" v-model="data.catchCopy"></td>
    </tr>
    <tr>
      <th>お店からのコメント</th>
      <td>
        <jodit-editor v-if="isEditorReady" v-model="data.shopComment" :editor-options="joditOptions"></jodit-editor>
      </td>
    </tr>
    <tr>
      <th>女の子からのコメント</th>
      <td>
        <jodit-editor v-if="isEditorReady" v-model="data.girlComment" :editor-options="joditOptions"></jodit-editor>
      </td>
    </tr>
    <tr>
      <th>セールスポイント</th>
      <td>
        <ul class="list-unstyled d-flex flex-wrap" style="margin: 0;">
          <li v-for="point in sellingPoints" :key="point.value" class="selling_point">
            <label>
              <input type="checkbox" v-model="data.selling_points" :value="point.value">{{ point.label }}
            </label>
          </li>
        </ul>
      </td>
    </tr>
    <tr>
      <th>
        <div>
          <span>セールスポイント</span>
          <span class="fw-normal text-secondary cautionary_note">(ヘブンネット)</span>
        </div>
        <span class="fw-normal text-danger cautionary_note">※12個まで</span></th>
      <td>
        <ul class="list-unstyled d-flex flex-wrap" style="margin: 0;">
          <li v-for="point in chSellingPoints" :key="point.value" class="selling_point">
            <label>
              <input type="checkbox" name="ch_selling_points" @change="checkboxMaxSelection(12, 'ch_selling_points')" v-model="data.ch_selling_points" :value="point.value">{{ point.label }}
            </label>
          </li>
        </ul>
      </td>
    </tr>
    <tr>
      <th>
        <div>
          <span>セールスポイント</span>
          <span class="fw-normal text-secondary cautionary_note">(駅ちか)</span>
        </div>
        <div>
          <span class="bg-danger text-white p-1 cautionary_note rounded-1" style="margin-bottom: 0;">※必須</span>
        </div>
        <span class="fw-normal text-danger cautionary_note">※19個まで</span></th>
      <td>
        <div class="d-flex align-items-center border border-primary">
          <span class="fw-bold select_order text-center text-primary">表示順</span>
          <draggable v-model="data.ec_selling_points" item-key="element.index" tag="ul" class="list-unstyled d-flex flex-wrap ps-4 border-start border-primary select_order_title" style="margin: 0;">
            <template #item="{element}">
              <li :key="element.value" class="selected_point">{{ element.label }}</li>
            </template>           
          </draggable>
        </div>
        <ul class="list-unstyled d-flex flex-wrap" style="margin: 0;">
          <li v-for="point in ecSellingPoints" :key="point.value" class="selling_point">
            <label>
              <input type="checkbox" name="ec_selling_points" @change="checkboxMaxSelection(19, 'ec_selling_points')" v-model="data.ec_selling_points" :value="point">{{ point.label }}
            </label>
          </li>
        </ul>
      </td>
    </tr>
    <tr>
      <th>
        <div>
          <span>セールスポイント</span>
          <span class="fw-normal text-secondary cautionary_note">(ぴゅあらば)</span>
        </div>
        <span class="fw-normal text-danger cautionary_note">※3個まで</span></th>
      <td>
        <div class="d-flex align-items-center border border-primary">
          <span class="fw-bold select_order text-center text-primary">表示順</span>
          <draggable v-model="data.pl_selling_points" item-key="element.index" tag="ul" class="list-unstyled d-flex flex-wrap ps-4 border-start border-primary select_order_title" style="margin: 0;">
            <template #item="{element}">
              <li v-if="element.value" :key="element.value" class="selected_point">{{ element.label }}</li>
            </template>           
          </draggable>
        </div>
        <ul class="list-unstyled d-flex flex-wrap" style="margin: 0;">
          <li v-for="point in plSellingPoints" :key="point.value" class="selling_point">
            <label>
              <input type="checkbox" name="pl_selling_points" @change="checkboxMaxSelection(3, 'pl_selling_points')" v-model="data.pl_selling_points" :value="point">{{ point.label }}
            </label>
          </li>
        </ul>
      </td>
    </tr>
    <tr>
      <th>
        <div>
          <span>セールスポイント</span>
          <span class="fw-normal text-secondary cautionary_note">(風俗じゃぱん)</span>
        </div>
      </th>
      <td>
        <div class="d-flex align-items-center border border-primary">
          <span class="fw-bold select_order text-center text-primary">表示順</span>
          <draggable v-model="data.fj_selling_points" item-key="element.index" tag="ul" class="list-unstyled d-flex flex-wrap ps-4 border-start border-primary select_order_title" style="margin: 0;">
            <template #item="{element}">
              <li v-if="element.value" :key="element.value" class="selected_point">{{ element.label }}</li>
            </template>
          </draggable>
        </div>
        <div class="rounded bg-info mt-2 ps-3 pt-1 pb-1"><span class="fw-bold text-white">ルックス<span class="cautionary_note ms-2">※最大5個選択可能</span></span></div>
        <ul class="list-unstyled d-flex flex-wrap" style="margin: 0;">
          <li v-for="point in fjSellingPoints1" :key="point.value" class="selling_point">
            <label>
              <input type="checkbox" name="fj_selling_points1" @change="checkboxMaxSelection(5, 'fj_selling_points1')" v-model="data.fj_selling_points" :value="point">{{ point.label }}
            </label>
          </li>
        </ul>
        <div class="rounded bg-info mt-2 ps-3 pt-1 pb-1"><span class="fw-bold text-white">性格<span class="cautionary_note ms-2">※最大2個選択可能</span></span></div>
        <ul class="list-unstyled d-flex flex-wrap" style="margin: 0;">
          <li v-for="point in fjSellingPoints2" :key="point.value" class="selling_point">
            <label>
              <input type="checkbox" name="fj_selling_points2" @change="checkboxMaxSelection(2, 'fj_selling_points2')" v-model="data.fj_selling_points" :value="point">{{ point.label }}
            </label>
          </li>
        </ul>
        <div class="rounded bg-info mt-2 ps-3 pt-1 pb-1"><span class="fw-bold text-white">タイプ<span class="cautionary_note ms-2">※最大1個選択可能</span></span></div>
        <ul class="list-unstyled d-flex flex-wrap" style="margin: 0;">
          <li v-for="point in fjSellingPoints3" :key="point.value" class="selling_point">
            <label>
              <input type="checkbox" name="fj_selling_points3" @change="checkboxMaxSelection(1, 'fj_selling_points3')" v-model="data.fj_selling_points" :value="point">{{ point.label }}
            </label>
          </li>
        </ul>
        <div class="rounded bg-info mt-2 ps-3 pt-1 pb-1"><span class="fw-bold text-white">プレイ</span></div>
        <ul class="list-unstyled d-flex flex-wrap" style="margin: 0;">
          <li v-for="point in fjSellingPoints4" :key="point.value" class="selling_point">
            <label>
              <input type="checkbox" v-model="data.fj_selling_points" :value="point">{{ point.label }}
            </label>
          </li>
        </ul>
        <div class="rounded bg-info mt-2 ps-3 pt-1 pb-1"><span class="fw-bold text-white">こだわり・特徴・個性<span class="cautionary_note ms-2">※最大2個選択可能</span></span></div>
        <ul class="list-unstyled d-flex flex-wrap" style="margin: 0;">
          <li v-for="point in fjSellingPoints5" :key="point.value" class="selling_point">
            <label>
              <input type="checkbox" name="fj_selling_points4" @change="checkboxMaxSelection(2, 'fj_selling_points4')" v-model="data.fj_selling_points" :value="point">{{ point.label }}
            </label>
          </li>
        </ul>
      </td>
    </tr>
    <tr>
      <th>画像</th>
      <td>
        <div>
          <div>
            <label class="select_file">
              <input type="file" @change="uploadFile" accept=".jpg, .jpeg" name="cast_image_file_1" multiple> ファイル選択
            </label>
          </div>
          <draggable v-model="data.files" item-key="element.index" tag="ul" class="list-unstyled d-flex flex-wrap justify-content-start mt-3 p-0">
            <template #item="{element, index}">
              <li class="uploadImg_width position-relative d-flex flex-column fs-6 p-2">
                <span class="position-absolute display-6 delete-mark"  @click="deleteFile(index)">&times</span>
                <img id="thumb" class="w-100" :src="showThumb(element)" >
                <!-- <div>
                  {{ element.name }}
                </div> -->
              </li>
            </template>           
          </draggable>
        </div>
      </td>
    </tr>
    <tr>
      <th>ヘブンネット 写メ日記</th>
      <td class="redips-mark">
        <div class="d-flex justify-content-start align-items-center">
          <p class="me-4" style="margin: 0;">女の子ID</p>
          <input type="text" class="w-75" v-model="data.diary">
        </div>
      </td>
    </tr>
    <tr>
      <th>雄琴ガイド 自撮り</th>
      <td class="redips-mark">
        <div class="d-flex justify-content-start align-items-center">
          <p class="me-4" style="margin: 0;">女の子ID</p>
          <input type="text" class="w-75" v-model="data.ogoto_guide">
        </div>
      </td>
    </tr>
    <tr>
      <th>X</th>
      <td class="redips-mark">
        <div class="d-flex justify-content-start align-items-center">
          <p class="me-4" style="margin: 0;">アカウント</p>
          <input type="text" class="w-75" v-model="data.x_account">
        </div>
      </td>
    </tr>
    <tr>
      <th>女の子リンク先</th>
      <td class="redips-mark">
        <div class="d-flex justify-content-start align-items-center">
          <p class="me-4" style="margin: 0;">URL</p>
          <input type="text" class="w-75" v-model="data.profile_url">
        </div>
      </td>
    </tr>
    <!-- <tr id="dispPosition" v-if="data.situation === 'public'">
      <th>表示位置</th>
      <td>
        <select v-model="data.orderNumber" class="w-25">
          <option value="0">先頭</option>
          <option v-for="(cast, index) in filteredCastData" :value="index + 1">
            {{ cast.castName }}の次
          </option>
        </select>
      </td>
    </tr> -->
	</tbody>
  <div class="d-flex align-items-center" style="height: 130px;" v-if="isAnyFieldEmpty">
    <button type="button" class="btn btn-secondary w-25 h-50 mx-auto pe-none">修正する</button>
  </div>
  <div class="d-flex align-items-center" style="height: 130px;"  v-else>
    <button type="button" class="btn btn-success w-25 h-50 mx-auto" @click="openUploadModal">修正する</button>
  </div>
  <UploadModal
    :show = 'data.UploadModal'
    :send = 'data.send'
    :progressBar = 'data.progressBar'
    :successWidth = 'data.successWidth'
    :send_completed = 'data.send_completed'
    @close = 'closeUploadModal'
  />
</template>

<script setup>
import UploadModal from './modalWindow/UploadModal.vue';
import { ref, reactive, computed, onMounted, } from 'vue';
import { db, storage } from '../firebase_settings/index.js';
import { set, update, ref as dbRef, get } from "firebase/database";
import { getDownloadURL, ref as imgRef, uploadBytesResumable, deleteObject, listAll } from "firebase/storage";
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/useUserStore.js';
import joditOptions from './Composable/joditOptions.js';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import draggable from 'vuedraggable';
import { flags, cups, sellingPoints, chSellingPoints, ecSellingPoints, plSellingPoints, fjSellingPoints1, fjSellingPoints2, fjSellingPoints3, fjSellingPoints4, fjSellingPoints5 } from './Composable/sellingPoint_items.js';
import dayjs from 'dayjs';
import { useCastDataStore } from '../store/useCastDataStore.js';

const castDataStore =  useCastDataStore();
const userStore = useUserStore();

const isEditorReady = ref(false); //  joditをキャストデータの読み込みより遅らせないとv-modelが表示されないので。

const data = reactive ({
  situation: 'public',
  castName: '',
  entryDate: '',
  entryRoute: '',
  flags: [],
  age: '',
  height: '',
  bust: '',
  waist: '',
  hip: '',
  cup: '',
  ch_type: '01',
  smoking: '',
  drink: '',
  question1: '',
  question2: '',
  question3: '',
  question4: '',
  question5: '',
  question6: '',
  question7: '',
  question8: '',
  question9: '',
  question10: '',
  question11: '',
  question12: '',
  question13: '',
  question14: '',
  question15: '',
  answer1: '',
  answer2: '',
  answer3: '',
  answer4: '',
  answer5: '',
  answer6: '',
  answer7: '',
  answer8: '',
  answer9: '',
  answer10: '',
  answer11: '',
  answer12: '',
  answer13: '',
  answer14: '',
  answer15: '',
  cast_freecontents_memory: false,
  catchCopy: '',
  shopComment: '',
  girlComment: '',
  selling_points: [],
  ch_selling_points: [],
  ec_selling_points: [],
  pl_selling_points: [],
  fj_selling_points: [],
  diary: '',
  ogoto_guide: '',
  x_account: '',
  profile_url: '',
  files: [],
  orderNumber: '',
  UploadModal: false,
  send: '送信中...',
  progressBar: false,
  successWidth: 0,
  send_completed: false,
  registered_date: '',
  id: ''
});

// DBのクエスチョンデータをdata.questionと紐づける。最後の行でonMountedしてるよ
const questionFetchData = async () => {
  const questionRef = dbRef(db, `users/${userStore.accountKey}/add_girl/questions/`);
  const snapshot = await get(questionRef); // getでsnapshot.val()を取得できる
  const questionData = snapshot.val();

  if (questionData) {
    for (let i = 0; i < 16; i++) {
      data[`question${i + 1}`] = questionData[`question${i + 1}`];
 
    }
  }
}

// チェックボックスの選択上限設定
const checkboxMaxSelection = (maxSelection, boxName) => {
  const checkboxes = document.querySelectorAll(`input[name="${boxName}"]`);
  const checkedCheckboxes = document.querySelectorAll(`input[name="${boxName}"]:checked`);
  
  checkboxes.forEach(checkbox => {
    checkbox.disabled = false;
  });

  if (checkedCheckboxes.length >= maxSelection) {
    checkboxes.forEach(checkbox => {
      if (!checkbox.checked) {
        checkbox.disabled = true;
        
      }
    });
  }
};

// 画像選択
function uploadFile(event) {
  const maxFiles = 10;
  if ( data.files.length + event.target.files.length > maxFiles) {
    alert(`画像は最大${maxFiles}枚まで選択できます`);
    return;
  }
  for(let i = 0; i < event.target.files.length; i++) {
    const file = event.target.files[i];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function() {  // Fileを読み込み終わった後の動作
      data.files.push({ file, name: file.name });
    };
  }
  event.preventDefault();
}

// 選択画像サムネイル
function showThumb(element) {
  if (element.file) {
    return URL.createObjectURL(element.file);
  }
  return element.url;
}

// 選択画像削除
function deleteFile(index) {
  data.files.splice(index, 1);
}

// キャストデータの表示
const url = window.location.href;
const parts = url.split('/');
const lastPart = parts[parts.length-1];
const allCastData = ref([]);
const orders = ref({});

//  表示するデータの読み込み
const castProfile_fetchData = async() => {

  //  キャスト全体のデータ
  const castDataRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data`);
  const castDataSnapshot = await get(castDataRef);
  const castData = castDataSnapshot.val();

  //  add_girl/cast_data/名前/profileのデータを読み込む
  const profileData = [];
  Object.keys(castData).forEach(castName => {
    const castDetails = castData[castName];
    const profile = castDetails.profile;
    profileData.push({...profile});
    allCastData.value = profileData;
  });

  //  編集対象のデータ読み込み
  const filteredData = allCastData.value.filter(data => data.id === parseInt(lastPart));
  const selectedData = filteredData[0];

  //  ここでdata内のプロパティを更新している
  Object.keys(data).forEach(key => {
    if (selectedData[key] !== undefined && selectedData[key] !== null) {
      data[key] = selectedData[key];
    }
  });

  //  順番
  let oldOrdersNumber = '0';  //  並び替え処理の際の計算に使うよ
  const oldOrdersNumberRef = dbRef(db, `users/${userStore.accountKey}/add_girl/orders/${selectedData.id}`);
  const oldOrdersNumberSnapshot = await get(oldOrdersNumberRef);
  oldOrdersNumber = oldOrdersNumberSnapshot.val();
  if (!oldOrdersNumber) {
    data.orderNumber = '0';
  }

  //  パネルの名前（全体）(画像が登録されている場合のみ/${data.castName}/panelが存在するので、ここで画像の有無と枚数を確認している)
  const imgNameRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data/${data.castName}/profile/panel`);
  const imgNameSnapshot = await get(imgNameRef);
  //  各パネルの名前
  const imgNameDataVal = imgNameSnapshot.val();
  
  //  パネルの名前があった場合の処理
  if (imgNameDataVal) {
    const imgData = await Promise.all(Object.keys(imgNameDataVal).map(async (key) => {
      const fileName = imgNameDataVal[key];
      const imgUrlRef = dbRef(db, `users/${userStore.accountKey}/add_girl/cast_data/${data.castName}/profile/panelURLs/${key}`);
      const imgUrlSnapshot = await get(imgUrlRef);
      const imgUrl = imgUrlSnapshot.val();

      if (!imgUrl || !fileName) return null;

      const extractPath = decodeURIComponent(imgUrl.split('/o/')[1].split('?')[0]);

      try {
        const fileRef = imgRef(storage, extractPath);
        const url = await getDownloadURL(fileRef);
        const response = await fetch(url);
        const blob = await response.blob();
        return { name: fileName, url: imgUrl, blob };

      } catch(error) {
        console.error('Failed to process file:', error);
        return null;

      }
    }));
    data.files = [...imgData.filter(item => item !== null)];
  }
}

// orderデータ
const fetchOrders = async() => {
  const ordersRef = dbRef(db, `users/${userStore.accountKey}/add_girl/orders`);
  const snapshot = await get(ordersRef);
  const ordersData = {};
  snapshot.forEach((childSnapshot) => {
    ordersData[childSnapshot.key] = childSnapshot.val();  // ordersDataが{childSnapshot.key: childSnapshot.val()}の形になる
  });
  orders.value = ordersData;
  data.orderNumber = orders.value[lastPart];
};

// 必須項目チェック
const isAnyFieldEmpty = computed(()=> {
  const isFieldEmpty =
  data.age === '' ||
  data.height === '' ||
  data.bust === '' ||
  data.waist === '' ||
  data.hip === '' ||
  data.cup === '' ||
  data.catchCopy === '' ||
  data.ec_selling_points.length === 0 ||
  data.entryRoute === '';

  return isFieldEmpty;
});

// 該当キャストのstorageのファイル数確認
const  getFileCount = async(directoryPath) => {
  const directoryRef = imgRef(storage, directoryPath);
  const listResult = await listAll(directoryRef);
  return listResult.prefixes.length;
}

// storage削除
const deleteFilesInDirectory = async(directoryPath) => {
  const directoryRef = imgRef(storage, directoryPath);
  const listResult = await listAll(directoryRef);
  const deleteFilePromises = listResult.items.map((itemRef) => deleteObject(itemRef));

  // サブディレクトリの処理
  const subDirPromises = listResult.prefixes.map(async (prefixRef) => {
    const subListResult = await listAll(prefixRef);
    const subDeleteFilePromises = subListResult.items.map((itemRef) => deleteObject(itemRef));
    return Promise.all(subDeleteFilePromises);
  });

  // サブディレクトリの削除も待つ
  await Promise.all(subDirPromises);
  
  // メインの削除処理を実行
  await Promise.all(deleteFilePromises);

};

const registerAndScrollToTop = async () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // アニメーション効果を使用する場合
  });
};

const uploadImages = async(files, castName) => {
  const urls = [];
  const filesLength = files.length;
  const fileCount = await getFileCount(`users/${userStore.accountKey}/add_girl/${castName}`);
  let totalProgress = 0;
  const fileProgress = Array(filesLength).fill(0);
  
  const updateProgress = (index, percentage) => {
    fileProgress[index] = percentage;
    const total = fileProgress.reduce((accumulator, currenValue)=> accumulator + currenValue, 0);
    totalProgress = total / filesLength;
    data.successWidth = totalProgress;
  }

  const updates = {};
  let panelUpdates = {};
  let panelURLsUpdates = {};
  
  if (fileCount > filesLength && filesLength > 0) {
    await deleteFilesInDirectory(`users/${userStore.accountKey}/add_girl/${castName}`);
    for (let i = filesLength + 1; i <= fileCount; i++) {
      panelUpdates[i] = null;
      panelURLsUpdates[i] = null;
  
    }
  }

  const uploadPromises = files.map(async(fileObj, index) => {
    const file = fileObj.file || fileObj.blob;
    const fileName = fileObj.file ? fileObj.file.name : fileObj.name;
    const fileRef = imgRef(storage, `users/${userStore.accountKey}/add_girl/${castName}/${index + 1}/${fileName}`);
    const existingFileRef = imgRef(storage, `users/${userStore.accountKey}/add_girl/${castName}/${index + 1}/`);

    await listAll(existingFileRef).then((result) => {
      const deletePromises = result.items.map((itemRef) => deleteObject(itemRef));
      return Promise.all(deletePromises);
    });

    const uploadTask = uploadBytesResumable(fileRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed', (snapshot) => {
        data.send = '送信中...';
        data.progressBar = true;
        data.send_completed = false;
        const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        updateProgress(index, percentage);
    
      }, (error) => {
        reject(error);
    
      }, async () => {
        try {
          const imgUrl = await getDownloadURL(fileRef);
          urls.push({
            index: index + 1,
            fileName,
            imgUrl
          });
          updateProgress(index, 100);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });
  await Promise.all(uploadPromises);
  if (filesLength === 0) {
    const noImgUrl = 'https://firebasestorage.googleapis.com/v0/b/phalandra-256-da694.appspot.com/o/noPhoto_panel%2Fno_photo.jpg?alt=media&token=3ac5cfde-1cea-413a-ad86-a915e27838d4';
    for (let i = 2; i <= fileCount; i++) {
      panelURLsUpdates[i] = null;
    }
    panelURLsUpdates[1] = noImgUrl;
    panelUpdates = null;
    await deleteFilesInDirectory(`users/${userStore.accountKey}/add_girl/${castName}`);
    data.send_completed = true;
    data.successWidth = 100;
  }
  // panelとpanelURLsの更新
  urls.forEach(url => {
    panelUpdates[url.index] = url.fileName;
    panelURLsUpdates[url.index] = url.imgUrl;
  });
  updates[`users/${userStore.accountKey}/add_girl/cast_data/${castName}/profile/panel`] = panelUpdates;
  updates[`users/${userStore.accountKey}/add_girl/cast_data/${castName}/profile/panelURLs`] = panelURLsUpdates;
  return updates;
}

const edit_girl = async() => {
  let d = new Date();
  let id = d.getTime();
  registerAndScrollToTop();
  const updates = await uploadImages(data.files, data.castName);  // uploadImagesでreturnした内容の引継ぎ
  const ordersRef = dbRef(db, `users/${userStore.accountKey}/add_girl/orders`);
  const snapshot = await get(ordersRef);
  const ordersData = snapshot.val();

  //  ログに書き込み
  await set(dbRef(db, `users/${userStore.accountKey}/logs/girls_log/${id}`), {
    content: 'プロフィール編集：' + data.castName,
    registration_date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  
  });

  //  公開の場合のみ並び順を登録する
  const checkOrderNumber = dbRef(db, `users/${userStore.accountKey}/add_girl/orders/${data.id}`);
  const checkOrderNumberSnapshot = await get(checkOrderNumber);
  const checkResult = checkOrderNumberSnapshot.val();

  if (data.situation === 'public') {
    
    //  'add_girl/orders/'及びcheckResultの有無による処理の分岐
    const newOrder = checkResult !== null && checkResult !== undefined 
      ? null
      : ordersData
        ? Object.keys(ordersData).length
        : 0;

    if (newOrder !== null) {      
     updates[`users/${userStore.accountKey}/add_girl/orders/${data.id}`] = newOrder;
    }

  } else {
    Object.keys(ordersData).forEach(key => {
      const currentOrder = ordersData[key];
      const updateOrder = currentOrder > parseInt(data.orderNumber) && data.id !== key
        ? currentOrder - 1
        : currentOrder;

      updates[`users/${userStore.accountKey}/add_girl/orders/${key}`] = updateOrder;
    });

    updates[`users/${userStore.accountKey}/add_girl/orders/${data.id}`] = null; //  nullを使って削除している

  }

  //  questionの登録
  if(data.cast_freecontents_memory) {
    for (let i = 0; i < 15; i++) {
      updates[`users/${userStore.accountKey}/add_girl/questions/question${i + 1}`] = data[`question${i + 1}`];
    };
  }

  //  登録先パスの設定
  const castProfile = (castName) => {
    return `users/${userStore.accountKey}/add_girl/cast_data/${castName}/profile`;
  }

  const castProfilePath = castProfile(data.castName);

  // 残りのデータをupdatesオブジェクトに追加
  Object.assign(updates, {
    [`${castProfilePath}/situation`]: data.situation,
    [`${castProfilePath}/castName`]: data.castName,
    [`${castProfilePath}/entryDate`]: data.entryDate,
    [`${castProfilePath}/entryRoute`]: data.entryRoute,
    [`${castProfilePath}/flags`]:
    data.flags.length === 0
      ? { 0: { label: '', value: '' } }
      : ( 
        data.flags[0].label === ''
        ? data.flags.length > 1
          ? data.flags.slice(1)
          : { 0: { label: '', value: '' } }
        : data.flags
      ),
    [`${castProfilePath}/age`]: data.age,
    [`${castProfilePath}/height`]: data.height,
    [`${castProfilePath}/bust`]: data.bust,
    [`${castProfilePath}/waist`]: data.waist,
    [`${castProfilePath}/hip`]: data.hip,
    [`${castProfilePath}/cup`]: data.cup,
    [`${castProfilePath}/ch_type`]: data.ch_type,
    [`${castProfilePath}/smoking`]: data.smoking,
    [`${castProfilePath}/drink`]: data.drink,
    [`${castProfilePath}/question1`]: data.question1,
    [`${castProfilePath}/question2`]: data.question2,
    [`${castProfilePath}/question3`]: data.question3,
    [`${castProfilePath}/question4`]: data.question4,
    [`${castProfilePath}/question5`]: data.question5,
    [`${castProfilePath}/question6`]: data.question6,
    [`${castProfilePath}/question7`]: data.question7,
    [`${castProfilePath}/question8`]: data.question8,
    [`${castProfilePath}/question9`]: data.question9,
    [`${castProfilePath}/question10`]: data.question10,
    [`${castProfilePath}/question11`]: data.question11,
    [`${castProfilePath}/question12`]: data.question12,
    [`${castProfilePath}/question13`]: data.question13,
    [`${castProfilePath}/question14`]: data.question14,
    [`${castProfilePath}/question15`]: data.question15,
    [`${castProfilePath}/answer1`]: data.answer1,
    [`${castProfilePath}/answer2`]: data.answer2,
    [`${castProfilePath}/answer3`]: data.answer3,
    [`${castProfilePath}/answer4`]: data.answer4,
    [`${castProfilePath}/answer5`]: data.answer5,
    [`${castProfilePath}/answer6`]: data.answer6,
    [`${castProfilePath}/answer7`]: data.answer7,
    [`${castProfilePath}/answer8`]: data.answer8,
    [`${castProfilePath}/answer9`]: data.answer9,
    [`${castProfilePath}/answer10`]: data.answer10,
    [`${castProfilePath}/answer11`]: data.answer11,
    [`${castProfilePath}/answer12`]: data.answer12,
    [`${castProfilePath}/answer13`]: data.answer13,
    [`${castProfilePath}/answer14`]: data.answer14,
    [`${castProfilePath}/answer15`]: data.answer15,
    [`${castProfilePath}/catchCopy`]: data.catchCopy,
    [`${castProfilePath}/shopComment`]: data.shopComment,
    [`${castProfilePath}/girlComment`]: data.girlComment,
    [`${castProfilePath}/selling_points`]:
    data.selling_points.length === 0
      ? { 0: { label: '', value: '' } }
      : ( 
        data.selling_points[0].label === ''
        ? data.selling_points.length > 1
          ? data.selling_points.slice(1)
          : { 0: { label: '', value: '' } }
        : data.selling_points
      ),
    [`${castProfilePath}/ch_selling_points`]:
    data.ch_selling_points.length === 0
      ? { 0: { label: '', value: '' } }
      : ( 
        data.ch_selling_points[0].label === ''
        ? data.ch_selling_points.length > 1
          ? data.ch_selling_points.slice(1)
          : { 0: { label: '', value: '' } }
        : data.ch_selling_points
      ),
    [`${castProfilePath}/ec_selling_points`]: data.ec_selling_points,  //  必須項目なので0個な事がない
    [`${castProfilePath}/pl_selling_points`]:
    data.pl_selling_points.length === 0
      ? { 0: { label: '', value: '' } }
      : ( 
        data.pl_selling_points[0].label === ''
        ? data.pl_selling_points.length > 1
          ? data.pl_selling_points.slice(1)
          : { 0: { label: '', value: '' } }
        : data.pl_selling_points
      ),
    [`${castProfilePath}/fj_selling_points`]:
    data.fj_selling_points.length === 0
      ? { 0: { label: '', value: '' } }
      : ( 
        data.fj_selling_points[0].label === ''
        ? data.fj_selling_points.length > 1
          ? data.fj_selling_points.slice(1)
          : { 0: { label: '', value: '' } }
        : data.fj_selling_points
      ),
    [`${castProfilePath}/diary`]: data.diary,
    [`${castProfilePath}/ogoto_guide`]: data.ogoto_guide,
    [`${castProfilePath}/x_account`]: data.x_account,
    [`${castProfilePath}/profile_url`]: data.profile_url,
  });
  
  await update(dbRef(db), updates);
  
  if(data.successWidth === 100) {
    data.send_completed = true;
    data.send = '送信完了';
    castDataStore.setupRealtimeListener();
  }
}

const openUploadModal = async()=> {

  data.UploadModal = true;
  
  await edit_girl();

  //  castNameをバックエンドに受け渡す
  try {
    
    const response = await fetch(`${userStore.API_BASE_URL}/edit-castData`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ accountKey: userStore.accountKey, castName: data.castName }),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const result = await response.json();
    console.log('Success:', result);

  } catch(error) {
    console.error(error.message);
    
  }
}

const router = useRouter();

const closeUploadModal = ()=> {
  data.UploadModal = false;
  router.push('/girls_list');

}

onMounted(async() => {
  //  ↓Single Page Application (SPA)なので前ページ（girls_list.vue）のスクロール位置が保持されてしまうのでそれを回避
  router.afterEach(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  })
  
  await questionFetchData();
  await castProfile_fetchData();
  await fetchOrders();
  checkboxMaxSelection(12, 'ch_selling_points');
  checkboxMaxSelection(19, 'ec_selling_points');
  checkboxMaxSelection(3, 'pl_selling_points');
  checkboxMaxSelection(5, 'fj_selling_points1');
  checkboxMaxSelection(2, 'fj_selling_points2');
  checkboxMaxSelection(1, 'fj_selling_points3');
  checkboxMaxSelection(2, 'fj_selling_points4');
  isEditorReady.value = true;

});
</script>