<script setup lang="ts">
import MultipleWorkspaceComponent from '@/components/workspaces/MultipleWorkspaceComponent.vue';
import { CONTEXT_MENU_API } from '@/libraries/menus/service';
import { LeafArea, Workspace } from '@/libraries/workspaces';
import { InMemoryWorkspaceRepository, WorkspaceService } from '@/libraries/workspaces/service';
import { inject } from 'vue';
import DemoPaddedComponent from '../common/DemoPaddedComponent.vue';
import { DEMO_AREA_CODE } from '@/demo';
import type { ICodeContext } from '../common';
import { v4 } from 'uuid';

const CodeIndex = "ZXhwb3J0IGludGVyZmFjZSBJUGxhY2Vob2xkZXJDb250ZXh0IGV4dGVuZHMgSUNvbnRleHQgewoJdGl0bGU6IHN0cmluZzsKCXN1YnRpdGxlPzogc3RyaW5nIHwgdW5kZWZpbmVkOwp9CgovLyBhbmQgZGVmYXVsdCBtb3VudCB0byAjYXBw";
const CodeApp = "PHNjcmlwdCBzZXR1cCBsYW5nPSJ0cyI+CmltcG9ydCB7IEluaXRBcmVhU2VydmljZSB9IGZyb20gJ0AvY29tcG9uZW50cy93aW5kb3cnOwppbXBvcnQgRGVtb1BsYWNlaG9sZGVyQXJlYSBmcm9tICcuL2FyZWFzL2NvbW1vbi9EZW1vUGxhY2Vob2xkZXJBcmVhLnZ1ZSc7CmltcG9ydCB7IElOSVRfV0lORE9XX1NFUlZJQ0VfS0VZIH0gZnJvbSAnQC9saWJyYXJpZXMvd2luZG93JzsKaW1wb3J0IHsgcHJvdmlkZSB9IGZyb20gJ3Z1ZSc7CmltcG9ydCBEZW1vV29ya3NwYWNlRXhhbXBsZSBmcm9tICcuL2FyZWFzL3dvcmtwYWNlcy9EZW1vV29ya3NwYWNlRXhhbXBsZS52dWUnOwoKY29uc3QgaW5pdFdpbmRvd1NlcnZpY2UgPSBuZXcgSW5pdEFyZWFTZXJ2aWNlKCk7CmluaXRXaW5kb3dTZXJ2aWNlLnJlZ2lzdGVyQXJlYSgiZGVtby5jb21tb24ucGxhY2Vob2xkZXIiLCB7IG5hbWU6ICJQbGFjZWhvbGRlciIgfSwgKCkgPT4gRGVtb1BsYWNlaG9sZGVyQXJlYSk7Cgpwcm92aWRlKElOSVRfV0lORE9XX1NFUlZJQ0VfS0VZLCBpbml0V2luZG93U2VydmljZSk7Cgo8L3NjcmlwdD4KCjx0ZW1wbGF0ZT4KICAgIDxEZW1vV29ya3NwYWNlRXhhbXBsZSAvPgo8L3RlbXBsYXRlPg==";
const CodeDemoPlaceholderArea = "PHNjcmlwdCBzZXR1cCBsYW5nPSJ0cyI+CmltcG9ydCB7IFdPUktTUEFDRV9BUEkgfSBmcm9tICdAL2NvbXBvbmVudHMvd29ya3NwYWNlcyc7CmltcG9ydCB7IGluamVjdCB9IGZyb20gJ3Z1ZSc7CmltcG9ydCB0eXBlIHsgSVBsYWNlaG9sZGVyQ29udGV4dCB9IGZyb20gJy4nOwoKY29uc3Qgd29ya3NwYWNlID0gaW5qZWN0KFdPUktTUEFDRV9BUEkpOwoKY29uc3QgY29udGV4dCA9IHdvcmtzcGFjZT8uZ2V0Q29udGV4dDxJUGxhY2Vob2xkZXJDb250ZXh0PigpID8/IHsKICAgIHRpdGxlOiAiQ29udGV4dCBJcyBOb3QgUHJlc2VudCIKfQoKPC9zY3JpcHQ+Cgo8dGVtcGxhdGU+CiAgICA8ZGl2IHN0eWxlPSJqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsgaGVpZ2h0OiAxMDAlOyBhbGlnbi1pdGVtczogY2VudGVyOyBkaXNwbGF5OiBmbGV4OyB0ZXh0LWFsaWduOiBjZW50ZXI7Ij4KICAgICAgICA8ZGl2PgogICAgICAgICAgICA8aDI+e3sgY29udGV4dC50aXRsZSB9fTwvaDI+CiAgICAgICAgICAgIDxwIHYtaWY9ImNvbnRleHQuc3VidGl0bGUiPnt7IGNvbnRleHQuc3VidGl0bGUgfX08L3A+CiAgICAgICAgPC9kaXY+CiAgICA8L2Rpdj4KPC90ZW1wbGF0ZT4K";
const CodeDemoWorkspaceExample = "PHNjcmlwdCBzZXR1cCBsYW5nPSJ0cyI+CmltcG9ydCBXb3Jrc3BhY2VDb21wb25lbnQgZnJvbSAnQC9jb21wb25lbnRzL3dvcmtzcGFjZXMvV29ya3NwYWNlQ29tcG9uZW50LnZ1ZSc7CmltcG9ydCB7IEFyZWFTaXplLCBDb250YWluZXJBcmVhLCBMZWFmQXJlYSwgT3JpZW50YXRpb24sIFdvcmtzcGFjZSB9IGZyb20gJ0AvbGlicmFyaWVzL3dvcmtzcGFjZXMnOwppbXBvcnQgdHlwZSB7IElQbGFjZWhvbGRlckNvbnRleHQgfSBmcm9tICcuLi9jb21tb24nOwoKY29uc3QgZmlyc3QgPSBuZXcgTGVhZkFyZWE8SVBsYWNlaG9sZGVyQ29udGV4dD4oImRlbW8uY29tbW9uLnBsYWNlaG9sZGVyIiwgeyB0aXRsZTogIlRoaXMgaXMgdGhlIGxlZnQgc2lkZSIsIHN1YnRpdGxlOiAiVGhlcmUncyBhIHJpZ2h0IHNpZGUgLT4iIH0pOwpjb25zdCBzZWNvbmQgPSBuZXcgTGVhZkFyZWE8SVBsYWNlaG9sZGVyQ29udGV4dD4oImRlbW8uY29tbW9uLnBsYWNlaG9sZGVyIiwgeyB0aXRsZTogIlllcywgSSdtIHRoZSByaWdodCBzaWRlIiB9KTsKY29uc3QgY29udGFpbmVyID0gbmV3IENvbnRhaW5lckFyZWEoT3JpZW50YXRpb24uSG9yaXpvbnRhbCwgZmlyc3QsIHNlY29uZCwgbmV3IEFyZWFTaXplKDIsICJmciIpLCBuZXcgQXJlYVNpemUoMSwgImZyIikpOwpjb25zdCB3b3Jrc3BhY2UgPSBuZXcgV29ya3NwYWNlKGNvbnRhaW5lcik7Cgo8L3NjcmlwdD4KCjx0ZW1wbGF0ZT4KICAgIDxXb3Jrc3BhY2VDb21wb25lbnQgOndvcmtzcGFjZT0id29ya3NwYWNlIiAvPgo8L3RlbXBsYXRlPgo=";

const service = new WorkspaceService(new InMemoryWorkspaceRepository());
service.add("index.js", new Workspace(new LeafArea<ICodeContext>(v4(), DEMO_AREA_CODE, { code: atob(CodeIndex) })))
service.add("App.vue", new Workspace(new LeafArea<ICodeContext>(v4(), DEMO_AREA_CODE, { code: atob(CodeApp) })));
service.add("DemoPlaceholderArea.vue", new Workspace(new LeafArea<ICodeContext>(v4(), DEMO_AREA_CODE, { code: atob(CodeDemoPlaceholderArea) })));
service.add("DemoWorkspaceExample.vue", new Workspace(new LeafArea<ICodeContext>(v4(), DEMO_AREA_CODE, { code: atob(CodeDemoWorkspaceExample) })));

const menu = inject(CONTEXT_MENU_API);

</script>

<template>
    <div style="height: 90%;">
        <div style="margin: 1rem; text-align: center;">
            <h1>Create Workspace</h1>
            <p>The area code is on the right.</p>
            <p style="color: var(--cl-tx2);">Yes, the workspace is also used for code tabs :)</p>
        </div>
        <div style="height: 32rem;">
            <DemoPaddedComponent>
                <MultipleWorkspaceComponent :service="service" :menu="menu!"></MultipleWorkspaceComponent>
            </DemoPaddedComponent>
        </div>
    </div>
</template>
