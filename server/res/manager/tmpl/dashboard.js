(() => {
    'use strict';

    module.exports = () => {
        return '' +
`<main class='clearfix'>
    <div id='viewport' class='viewport clearfix'>
        <div id='info-container' class='server-item-container clearfix'></div>
    </div>
</main>
<script data-tpl="server-item" type='text/html'>
    <div class='server-item {{if !active}}inactive{{/if}}' data-rel='\${id}'>
        <div class='server-id' title='id'>\${id}</div>
        <div class='machine-id' title='machine-id'>\${uid}</div>
        <div class='info-bar' data-inspect='cpu' title='cpu'>
            <div class='logo'><span class='oops-memory'></span></div>
            <div class='progress'><div class='bar'></div></div>
            <div class='percentage'>\${cpuRate}</div>
        </div>
        <div class='info-bar' data-inspect='mem' title='memory'>
            <div class='logo'><span class='oops-layers'></span></div>
            <div class='progress'><div class='bar'></div></div>
            <div class='percentage'>\${memRate}</div>
        </div>
        <div class='info-bar' data-inspect='disk' title='disk'>
            <div class='logo'><span class='oops-storage'></span></div>
            <div class='progress'><div class='bar'></div></div>
            <div class='percentage'>\${diskRate}</div>
        </div>
        <div class='alive-time' title='alive time'>alive: \${aliveTime}</div>
        <div class='last-pack-name' title='last pack name'>last pack: \${lastPackName}</div>
        <div class='last-update-time' title='last update time'>last update: \${lastUpdateTime}</div>
    </div>
</script>`;
    };
})();
