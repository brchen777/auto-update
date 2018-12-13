(() => {
    'use strict';

    module.exports = () => {
        return '' +
`<main class='clearfix'>
    <nav id='main-nav'></nav>
    <div id='viewport' class='viewport clearfix'>
        <div id='info-container' class='server-item-container'></div>
    </div>
</main>
<script data-tpl="server-item" type='text/html'>
    <li class='server-item {{if !active}}inactive{{/if}}' data-rel='\${id}'>
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
        <div class='update-time'>\${updateTime}</div>
    </li>
</script>`;
    };
})();
