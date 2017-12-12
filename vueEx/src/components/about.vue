<template>
    <div class="about">
        我是{{page}}
    </div>
</template>

<script>
    export default {
        name: 'about',
        data () {
            return {
                page:'about页面'
            }
        },
        created() {
            window.tmData={
                'name':'lucy',
                'age':20
            }
            console.log(window)
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
    $class-pre:"about";
    .#{$class-pre}{
        color: red;
        font-size: 30px;
    }
</style>