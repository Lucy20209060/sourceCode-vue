<template>
    <div class="container">
        index
    </div>
</template>

<script>
    export default {
        name: 'HelloWorld',
        data () {
            return {
                video: {
                    sources: [{
                        src: 'http://vjs.zencdn.net/v/oceans.mp4',
                        type: 'video/mp4'
                    }],
                    options: {
                        autoplay: false,
                        volume: 0.6,
                        poster: 'http://covteam.u.qiniudn.com/poster.png'
                    }
                }
            }
        },
        components:{
            
        },
        created() {
            console.log(window)
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
    $class-pre:"hello";
    .#{$class-pre}{
        color: red;
    }
</style>
