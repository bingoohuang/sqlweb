$(function () {
    $('#SqlsVersion').click(function () {
        $('.MainDivs').hide()
        $('.SqlsVersionDiv').show()
    })

    $('#CloseSqlsVersionDiv').click(function () {
        $('.MainDivs').hide()
        $('.SqlWebDiv').show()
    })
})