<script>
    import {link} from 'svelte-spa-router';
    import {tree} from "./menu";
    import {hasPermission, permissions} from "./stores.js";

    function onView() {
        jQuery("body").removeClass("sidebar-enable");
    }

    // Track the currently open menu
    let openMenuIndex = null;

    function toggleMenu(index) {
        // If the clicked menu is already open, close it
        if (openMenuIndex === index) {
            openMenuIndex = null;
        } else {
            // Open the clicked menu and close others
            openMenuIndex = index;
        }
    }
</script>

<!--- Sidemenu -->
<div id="sidebar-menu">
    <!-- Left Menu Start -->
    <ul class="metismenu list-unstyled" id="side-menu">
        <li class="menu-title">Menu</li>
        {#each tree as menu, index}
            {#if menu.access == undefined || (hasPermission($permissions,menu.access) )}
            <li>
                {#if menu.useLink}
                <!-- svelte-ignore a11y-missing-attribute -->
                <a use:link={menu.link} class="waves-effect">
                    {#if menu.icon && menu.icon != ""}
                        <i class={menu.icon}></i>
                    {/if}
                    <span>{menu.name}</span>
                </a>
                {:else}
                    <a href={menu.link} class="waves-effect" on:click={() => toggleMenu(index)}>
                        {#if menu.icon && menu.icon != ""}
                            <i class={menu.icon}></i>
                        {/if}
                        <span>{menu.name}</span>
                    </a>
                {/if}

                {#if menu.submenu}
                <ul class="sub-menu" aria-expanded="false" class:hidden={openMenuIndex !== index}>
                    {#each menu.submenu as submenu}
                    {#if submenu.access == undefined || (hasPermission($permissions, submenu.access) )}
                    <li>
                        {#if !submenu.useLink}
                            <a href={submenu.link} on:click={onView}>{submenu.name}</a>
                        {:else}
                            <!-- svelte-ignore a11y-missing-attribute -->
                            <a use:link={submenu.link} on:click={onView}>{submenu.name}</a>
                        {/if}
                    </li>
                    {/if}
                    {/each}
                </ul>
                {/if}
            </li>
            {/if}
        {/each}
    </ul>
</div>

<style>
    /* Hide submenus by default */
    .sub-menu {
        display: none;
    }
    /* Show the submenu when the menu is open */
    .sub-menu:not(.hidden) {
        display: block;
    }
</style>
